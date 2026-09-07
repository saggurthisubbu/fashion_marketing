import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Notification } from '../models/Notification.js';
import { protect, adminOnly, storeOwnerOrAdmin } from '../middleware/auth.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '../services/emailService.js';

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
    const {
      customer,
      customerEmail: directCustomerEmail,
      items,
      totalAmount,
      paymentMethod,
      locationLink,
      customerLocation,
      assignedStore,
      customerLatitude,
      customerLongitude
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({ message: 'Customer name, phone, and address are required' });
    }

    // 1. Capture customer coordinates (if provided)
    const customerLat = customerLatitude !== undefined
      ? Number(customerLatitude)
      : (customerLocation?.lat !== undefined ? Number(customerLocation.lat) : null);
    const customerLng = customerLongitude !== undefined
      ? Number(customerLongitude)
      : (customerLocation?.lng !== undefined ? Number(customerLocation.lng) : null);

    const hasCustomerLocation =
      customerLat !== null &&
      customerLng !== null &&
      !isNaN(customerLat) &&
      !isNaN(customerLng);

    // 2. Retrieve active stores for fulfillment assignment
    const activeStores = await Store.find({ status: 'Active' });

    let nearestStore = null;
    let minDistance = null;

    if (activeStores && activeStores.length > 0) {
      if (hasCustomerLocation) {
        let lowestDist = Infinity;
        for (const store of activeStores) {
          if (typeof store.location?.lat === 'number' && typeof store.location?.lng === 'number') {
            const dist = haversineDistance(customerLat, customerLng, store.location.lat, store.location.lng);
            if (dist < lowestDist) {
              lowestDist = dist;
              nearestStore = store;
            }
          }
        }
        if (nearestStore) {
          minDistance = lowestDist;
        }
      }
      // If no GPS coordinates provided or store couldn't be matched by distance, assign the first active store
      if (!nearestStore) {
        nearestStore = activeStores[0];
      }
    }

    const finalAssignedStore = nearestStore ? {
      id: nearestStore._id,
      name: nearestStore.name,
      distanceKm: minDistance !== null ? parseFloat(minDistance.toFixed(2)) : null
    } : (assignedStore || { id: null, name: 'QuickFit Central Store', distanceKm: null });

    // 3. Deduct stock for ordered items
    for (const item of items) {
      if (item.product) {
        try {
          const dbProduct = await Product.findById(item.product);
          if (dbProduct) {
            item.storeId = dbProduct.storeId || nearestStore?._id || null;
            item.storeName = dbProduct.storeName || nearestStore?.name || '';
            dbProduct.stockQuantity = Math.max(0, (dbProduct.stockQuantity || 0) - (item.quantity || 1));
            if (dbProduct.stockQuantity <= 0) {
              dbProduct.inStock = false;
            }
            await dbProduct.save();
          }
        } catch (stockErr) {
          console.warn('[Stock Deduction Warning]:', stockErr.message);
        }
      }
    }

    // 4. Generate unique Order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `QF-VJ-${randomSuffix}`;

    const resolvedCustomerEmail = (
      directCustomerEmail ||
      customer.email ||
      req.body.email ||
      ''
    ).trim();

    const hasCustomerEmail = Boolean(resolvedCustomerEmail && resolvedCustomerEmail.includes('@'));

    const order = new Order({
      orderId,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: resolvedCustomerEmail,
        address: customer.address.trim(),
        landmark: customer.landmark ? customer.landmark.trim() : '',
        pincode: customer.pincode ? customer.pincode.trim() : '520010',
        area: customer.area ? customer.area.trim() : 'MG Road'
      },
      items: items.map(item => ({
        product: item.product || item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || item.qty || 1,
        size: item.size || item.selectedSize || 'M',
        color: item.color || item.selectedColor || '',
        image: item.image || item.imageUrl || item.images?.front || '',
        storeId: item.storeId || finalAssignedStore.id || null,
        storeName: item.storeName || finalAssignedStore.name || ''
      })),
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
      deliveryStatus: 'Confirmed',
      emailStatus: hasCustomerEmail ? 'pending' : 'skipped',
      emailDeliveryStatus: hasCustomerEmail ? 'Pending' : 'Skipped',
      locationLink: locationLink || '',
      customerLocation: hasCustomerLocation
        ? { lat: customerLat, lng: customerLng }
        : { lat: null, lng: null },
      assignedStore: finalAssignedStore,
      orderDate: new Date()
    });

    // 5. Save Order to Database
    const createdOrder = await order.save();

    // Required Backend Logs: Order Created & Order Saved To Database
    console.log(`\n===============================================================`);
    console.log(`[Order Created]: Order #${createdOrder.orderId} created for ${createdOrder.customer?.name} (${createdOrder.customer?.email || 'No email entered'}) - Total: ₹${createdOrder.totalAmount}`);
    console.log(`[Order Saved To Database]: Order #${createdOrder.orderId} (ID: ${createdOrder._id}) saved successfully to MongoDB Atlas.`);
    console.log(`===============================================================\n`);

    // 6. Update user totalOrders if registered
    if (hasCustomerEmail) {
      User.findOneAndUpdate({ email: resolvedCustomerEmail }, { $inc: { totalOrders: 1 } }).catch(() => {});
    }

    // 7. Send Customer Confirmation Email (Nodemailer SMTP)
    if (hasCustomerEmail) {
      sendOrderConfirmationEmail(createdOrder)
        .then((res) => {
          if (res.success) {
            console.log(`[Email Sent]: Order confirmation email successfully delivered to ${resolvedCustomerEmail} for Order #${createdOrder.orderId}`);
          } else {
            console.error(`[Email Failed]: Order confirmation email could not be sent to ${resolvedCustomerEmail} - Reason: ${res.error || res.reason}`);
          }
        })
        .catch((err) => {
          console.error(`[Email Failed]: SMTP error while sending confirmation for Order #${createdOrder.orderId}:`, err.message);
        });
    } else {
      console.log(`[Email Notice]: Customer email not provided for Order #${createdOrder.orderId}, email confirmation skipped.`);
    }

    // 8. Send Admin & Store Owner Notifications
    sendAdminOrderNotificationEmail(createdOrder).catch((adminErr) => {
      console.error('[Admin Notification Error]:', adminErr.message);
    });

    // 9. In-App Notifications
    try {
      await Notification.create({
        title: `New Order #${createdOrder.orderId}`,
        message: `${createdOrder.customer.name} placed an order for ${createdOrder.items.length} items (₹${createdOrder.totalAmount}) via ${createdOrder.paymentMethod}.`,
        type: 'order',
        orderId: createdOrder.orderId,
        storeId: null,
        priority: 'high'
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr.message);
    }

    return res.status(201).json(createdOrder);
  } catch (error) {
    console.error('❌ [Order Creation Error]:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
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

// Admin: Assign delivery partner to order
router.put('/:id/assign-partner', protect, adminOnly, async (req, res) => {
  try {
    const { partnerId, partnerName, partnerPhone, vehicleNumber, deliveryStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.assignedPartner = {
      id: partnerId,
      name: partnerName,
      phone: partnerPhone,
      vehicleNumber: vehicleNumber || ''
    };
    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
