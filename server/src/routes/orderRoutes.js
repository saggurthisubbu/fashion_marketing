import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Notification } from '../models/Notification.js';
import { protect, adminOnly, storeOwnerOrAdmin } from '../middleware/auth.js';
import { sendEmailNotification, getStoreOwnerWhatsAppUrl } from '../utils/notifications.js';

const router = express.Router();

// ─── Haversine formula (server-side, no external APIs needed) ────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Find nearest active store within delivery radius ─────────────────────────
async function validateDeliveryZone(customerLat, customerLng) {
  const activeStores = await Store.find({ status: 'Active' });

  // No stores configured → allow orders (don't break existing functionality)
  if (!activeStores || activeStores.length === 0) {
    return { allowed: true, store: null, distanceKm: null, reason: 'no_stores' };
  }

  let nearest = null;
  let nearestDist = Infinity;

  for (const store of activeStores) {
    if (!store.location?.lat || !store.location?.lng) continue;
    const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = { store, distanceKm: dist };
    }
  }

  if (!nearest) {
    return { allowed: false, store: null, distanceKm: null, reason: 'no_valid_stores' };
  }

  // Check if nearest store covers this customer
  if (nearest.distanceKm <= nearest.store.deliveryRadiusKm) {
    return {
      allowed: true,
      store: nearest.store,
      distanceKm: nearest.distanceKm,
      reason: 'in_zone'
    };
  }

  return {
    allowed: false,
    store: nearest.store,
    distanceKm: nearest.distanceKm,
    reason: 'out_of_zone'
  };
}

// Create new order (Public or Customer)
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, locationLink, customerLocation, assignedStore, customerLatitude, customerLongitude, storeLatitude, storeLongitude } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STRICT BACKEND DELIVERY ZONE ENFORCEMENT & LOGGING AUDIT
    // ══════════════════════════════════════════════════════════════════════════
    
    // 1. Capture customer coordinates (nested or top-level)
    const customerLat = customerLatitude !== undefined ? Number(customerLatitude) : (customerLocation?.lat !== undefined ? Number(customerLocation.lat) : null);
    const customerLng = customerLongitude !== undefined ? Number(customerLongitude) : (customerLocation?.lng !== undefined ? Number(customerLocation.lng) : null);

    const hasCustomerLocation =
      customerLat !== null &&
      customerLng !== null &&
      !isNaN(customerLat) &&
      !isNaN(customerLng);

    // If customer coordinates are missing, reject order (Requirement 6)
    if (!hasCustomerLocation) {
      console.log('--- DELIVERY VALIDATION AUDIT ---');
      console.log('Store Coordinates: N/A');
      console.log('Customer Coordinates: Missing or Invalid');
      console.log('Calculated Distance: N/A');
      console.log('Store Radius: N/A');
      console.log('Validation Result: Rejected (Customer location is missing)');
      console.log('---------------------------------');

      return res.status(403).json({
        message: 'Delivery location is required. Please share your GPS location before placing an order.',
        code: 'LOCATION_REQUIRED'
      });
    }

    // 2. Retrieve active stores
    const activeStores = await Store.find({ status: 'Active' });

    // If no store coordinates exist, reject order (Requirement 5)
    if (!activeStores || activeStores.length === 0) {
      console.log('--- DELIVERY VALIDATION AUDIT ---');
      console.log('Store Coordinates: Missing (No active stores in DB)');
      console.log(`Customer Coordinates: lat: ${customerLat}, lng: ${customerLng}`);
      console.log('Calculated Distance: N/A');
      console.log('Store Radius: N/A');
      console.log('Validation Result: Rejected (No active stores configured)');
      console.log('---------------------------------');

      return res.status(403).json({
        message: 'Delivery is currently not available in your location. No active stores configured.',
        code: 'NO_STORES_CONFIGURED'
      });
    }

    // Check if any active store has valid coordinates
    let nearestStore = null;
    let minDistance = Infinity;

    for (const store of activeStores) {
      if (typeof store.location?.lat !== 'number' || typeof store.location?.lng !== 'number') continue;
      const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStore = store;
      }
    }

    // If no store coordinates exist, reject order (Requirement 5)
    if (!nearestStore) {
      console.log('--- DELIVERY VALIDATION AUDIT ---');
      console.log('Store Coordinates: Missing (Stores exist but none have coordinates)');
      console.log(`Customer Coordinates: lat: ${customerLat}, lng: ${customerLng}`);
      console.log('Calculated Distance: N/A');
      console.log('Store Radius: N/A');
      console.log('Validation Result: Rejected (No store coordinates exist)');
      console.log('---------------------------------');

      return res.status(403).json({
        message: 'Delivery is currently not available. Store coordinates are not configured.',
        code: 'NO_STORE_COORDINATES'
      });
    }

    const storeRadius = nearestStore.deliveryRadiusKm;
    const distanceKm = minDistance;
    const isWithinRadius = distanceKm <= storeRadius;

    // Requirement 8: Add exact console logs format requested
    console.log('--- DELIVERY VALIDATION AUDIT ---');
    console.log(`Store Coordinates: lat: ${nearestStore.location.lat}, lng: ${nearestStore.location.lng}`);
    console.log(`Customer Coordinates: lat: ${customerLat}, lng: ${customerLng}`);
    console.log(`Calculated Distance: ${distanceKm.toFixed(4)} KM`);
    console.log(`Store Radius: ${storeRadius} KM`);
    console.log(`Validation Result: ${isWithinRadius ? 'Allowed' : 'Rejected'}`);
    console.log('---------------------------------');

    // Requirement 9: If distance > radius, reject order (HTTP 403)
    if (!isWithinRadius) {
      return res.status(403).json({
        message: `Sorry, we are currently not available in your location. Nearest store is ${distanceKm.toFixed(1)} KM away.`,
        code: 'OUTSIDE_DELIVERY_ZONE',
        distanceKm: distanceKm,
        nearestStoreName: nearestStore.name
      });
    }

    // Override client store assignment with server-calculated nearest store info
    const verifiedStore = {
      id: nearestStore._id,
      name: nearestStore.name,
      distanceKm: parseFloat(distanceKm.toFixed(2))
    };
    req.body.assignedStore = verifiedStore;
    // ══════════════════════════════════════════════════════════════════════════


    // 1. Verify stock availability
    for (const item of items) {
      if (item.product) {
        const dbProduct = await Product.findById(item.product);
        if (dbProduct) {
          if (dbProduct.stockQuantity < item.quantity) {
            return res.status(400).json({
              message: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stockQuantity} remaining.`
            });
          }
        }
      }
    }

    // Deduct stock
    for (const item of items) {
      if (item.product) {
        const dbProduct = await Product.findById(item.product);
        if (dbProduct) {
          dbProduct.stockQuantity -= item.quantity;
          if (dbProduct.stockQuantity <= 0) {
            dbProduct.stockQuantity = 0;
            dbProduct.inStock = false;
          }
          await dbProduct.save();
        }
      }
    }

    // 1.5. Enrich each item with its product's storeId and storeName
    for (const item of items) {
      if (item.product) {
        const dbProduct = await Product.findById(item.product).select('storeId storeName');
        if (dbProduct) {
          item.storeId = dbProduct.storeId || null;
          item.storeName = dbProduct.storeName || '';
        }
      }
    }

    // 2. Generate unique 6-digit Order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `QF-VJ-${randomSuffix}`;

    const finalAssignedStore = req.body.assignedStore || assignedStore;

    const order = new Order({
      orderId,
      customer,
      items,
      totalAmount,
      paymentMethod,
      locationLink: locationLink || '',
      deliveryStatus: 'Confirmed',
      customerLocation: hasCustomerLocation
        ? { lat: customerLat, lng: customerLng }
        : { lat: null, lng: null },
      assignedStore: finalAssignedStore
        ? {
            id: finalAssignedStore.id || null,
            name: finalAssignedStore.name || '',
            distanceKm: finalAssignedStore.distanceKm !== undefined
              ? Number(finalAssignedStore.distanceKm)
              : null
          }
        : { id: null, name: '', distanceKm: null }
    });

    const createdOrder = await order.save();

    // 3. Update customer total orders if registered
    if (customer && customer.email) {
      const user = await User.findOne({ email: customer.email });
      if (user) {
        user.totalOrders += 1;
        await user.save();
      }
    }

    // 4. Trigger Email notification to admin
    sendEmailNotification(createdOrder);

    // 4b. Generate WhatsApp alert URLs for each unique store owner
    try {
      const uniqueStoreIds = [...new Set(
        createdOrder.items.map(i => i.storeId?.toString()).filter(Boolean)
      )];
      for (const sid of uniqueStoreIds) {
        const storeOwner = await User.findOne({ role: 'store_owner', assignedStoreId: sid }).select('phone name');
        if (storeOwner && storeOwner.phone) {
          const waUrl = getStoreOwnerWhatsAppUrl(createdOrder, sid, storeOwner.phone);
          if (waUrl) {
            console.log(`[WhatsApp → Store Owner (${storeOwner.name})]: ${waUrl.substring(0, 80)}...`);
          }
        }
      }
    } catch (waErr) {
      console.warn('[WhatsApp Store Owner Error]:', waErr.message);
    }

    // 5. In-App Notifications — Dual: per-store + super admin global
    try {
      // Collect unique store IDs from order items
      const storeIdsInOrder = [...new Set(
        createdOrder.items
          .map(item => item.storeId?.toString())
          .filter(Boolean)
      )];

      // Create one notification per unique store (visible to store_owner)
      for (const sid of storeIdsInOrder) {
        const sName = createdOrder.items.find(i => i.storeId?.toString() === sid)?.storeName || '';
        await Notification.create({
          title: `New Order #${createdOrder.orderId}`,
          message: `${createdOrder.customer.name} ordered items from ${sName || 'your store'} (₹${createdOrder.totalAmount}) via ${createdOrder.paymentMethod}.`,
          type: 'order',
          orderId: createdOrder.orderId,
          storeId: sid,
          priority: 'high'
        });
      }

      // Create one global notification (visible to Super Admin, storeId=null)
      const storeNote = storeIdsInOrder.length > 0
        ? ` → ${[...new Set(createdOrder.items.map(i => i.storeName).filter(Boolean))].join(', ')}`
        : '';
      await Notification.create({
        title: `New Order #${createdOrder.orderId}`,
        message: `${createdOrder.customer.name} ordered ${createdOrder.items.length} items (₹${createdOrder.totalAmount}) via ${createdOrder.paymentMethod}${storeNote}.`,
        type: 'order',
        orderId: createdOrder.orderId,
        storeId: null,
        priority: 'high'
      });
    } catch (notifErr) {
      console.warn('Could not create in-app notification:', notifErr.message);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Get order by Order ID (Tracking page)
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Store Owner: Get orders (scoped by role)
router.get('/', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      // Super Admin sees ALL orders
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      // Store owner sees only orders containing items from their store
      const storeId = req.user.assignedStoreId.toString();
      orders = await Order.find({
        'items.storeId': req.user.assignedStoreId
      }).sort({ createdAt: -1 });
    } else {
      orders = [];
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Store Owner: Update order status (scoped)
router.put('/:id/status', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Store owners can only update orders that contain items from their store
    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      const storeId = req.user.assignedStoreId.toString();
      const hasStoreItems = order.items.some(item => item.storeId?.toString() === storeId);
      if (!hasStoreItems) {
        return res.status(403).json({ message: 'You can only update orders from your store.' });
      }
    }

    order.deliveryStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
