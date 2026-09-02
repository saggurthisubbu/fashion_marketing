import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { Category } from '../models/Category.js';
import { Setting } from '../models/Setting.js';
import { Notification } from '../models/Notification.js';
import { Store } from '../models/Store.js';
import { protect, adminOnly, storeOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// 1. EXECUTIVE ANALYTICS & DASHBOARD METRICS
// ==========================================
router.get('/analytics', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let totalOrders, totalRevenue, totalCustomers, totalProducts, pendingOrders, deliveredOrders, cancelledOrders, outForDeliveryOrders, lowStockCount, outOfStockCount, activePartnersCount, lowStockProducts, salesByCategory, formattedTrends;

    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      const storeId = req.user.assignedStoreId;
      totalOrders = await Order.countDocuments({ 'items.storeId': storeId });
      
      const storeOrdersForCust = await Order.find({ 'items.storeId': storeId }).select('customer.email');
      totalCustomers = [...new Set(storeOrdersForCust.map(o => o.customer?.email).filter(Boolean))].length;

      totalProducts = await Product.countDocuments({ storeId });
      pendingOrders = await Order.countDocuments({ 'items.storeId': storeId, deliveryStatus: { $in: ['Pending', 'Confirmed'] } });
      deliveredOrders = await Order.countDocuments({ 'items.storeId': storeId, deliveryStatus: 'Delivered' });
      cancelledOrders = await Order.countDocuments({ 'items.storeId': storeId, deliveryStatus: 'Cancelled' });
      outForDeliveryOrders = await Order.countDocuments({ 'items.storeId': storeId, deliveryStatus: 'Out For Delivery' });

      // Total Revenue for this store specifically (summing items subtotal for items matching storeId)
      const revenueResult = await Order.aggregate([
        { $match: { deliveryStatus: { $ne: 'Cancelled' }, 'items.storeId': storeId } },
        { $unwind: '$items' },
        { $match: { 'items.storeId': storeId } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      lowStockProducts = await Product.find({ storeId, stockQuantity: { $lte: 10 } })
        .select('name stockQuantity inStock price boutique images image subcategory')
        .sort({ stockQuantity: 1 });
      lowStockCount = lowStockProducts.length;

      outOfStockCount = await Product.countDocuments({ storeId, stockQuantity: { $lte: 0 } });

      salesByCategory = await Product.aggregate([
        { $match: { storeId } },
        { $group: { _id: '$subcategory', count: { $sum: 1 }, totalStock: { $sum: '$stockQuantity' } } }
      ]);

      activePartnersCount = await DeliveryPartner.countDocuments({ status: { $in: ['Available', 'On Delivery'] } });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const dailyTrends = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            deliveryStatus: { $ne: 'Cancelled' },
            'items.storeId': storeId
          }
        },
        { $unwind: '$items' },
        { $match: { 'items.storeId': storeId } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              orderId: '$orderId'
            },
            itemRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            revenue: { $sum: '$itemRevenue' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      formattedTrends = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const found = dailyTrends.find(item => item._id === dateStr);
        formattedTrends.push({
          date: dateStr,
          day: dayName,
          revenue: found ? found.revenue : 0,
          orders: found ? found.orders : 0
        });
      }
    } else {
      totalOrders = await Order.countDocuments();
      totalCustomers = await User.countDocuments({ role: 'customer' });
      totalProducts = await Product.countDocuments();
      pendingOrders = await Order.countDocuments({ deliveryStatus: { $in: ['Pending', 'Confirmed'] } });
      deliveredOrders = await Order.countDocuments({ deliveryStatus: 'Delivered' });
      cancelledOrders = await Order.countDocuments({ deliveryStatus: 'Cancelled' });
      outForDeliveryOrders = await Order.countDocuments({ deliveryStatus: 'Out For Delivery' });

      const revenueResult = await Order.aggregate([
        { $match: { deliveryStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      lowStockProducts = await Product.find({ stockQuantity: { $lte: 10 } })
        .select('name stockQuantity inStock price boutique images image subcategory storeId storeName')
        .sort({ stockQuantity: 1 });
      lowStockCount = lowStockProducts.length;

      outOfStockCount = await Product.countDocuments({ stockQuantity: { $lte: 0 } });

      salesByCategory = await Product.aggregate([
        { $group: { _id: '$subcategory', count: { $sum: 1 }, totalStock: { $sum: '$stockQuantity' } } }
      ]);

      activePartnersCount = await DeliveryPartner.countDocuments({ status: { $in: ['Available', 'On Delivery'] } });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const dailyTrends = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            deliveryStatus: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      formattedTrends = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const found = dailyTrends.find(item => item._id === dateStr);
        formattedTrends.push({
          date: dateStr,
          day: dayName,
          revenue: found ? found.revenue : 0,
          orders: found ? found.orders : 0
        });
      }
    }

    res.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      outForDeliveryOrders,
      lowStockCount,
      outOfStockCount,
      activePartnersCount,
      lowStockProducts,
      salesByCategory,
      revenueTrends: formattedTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 1b. STORE-WISE ANALYTICS (Super Admin only)
// ==========================================
router.get('/store-analytics', protect, adminOnly, async (req, res) => {
  try {
    const stores = await Store.find({}).sort({ name: 1 });

    const storeStats = await Promise.all(stores.map(async (store) => {
      const storeId = store._id;

      const totalProducts = await Product.countDocuments({ storeId });
      const lowStockProducts = await Product.countDocuments({ storeId, stockQuantity: { $gt: 0, $lte: 10 } });
      const outOfStock = await Product.countDocuments({ storeId, stockQuantity: { $lte: 0 } });
      const totalStock = await Product.aggregate([
        { $match: { storeId } },
        { $group: { _id: null, total: { $sum: '$stockQuantity' } } }
      ]);

      const totalOrders = await Order.countDocuments({ 'items.storeId': storeId });
      const pendingOrders = await Order.countDocuments({
        'items.storeId': storeId,
        deliveryStatus: { $in: ['Pending', 'Confirmed'] }
      });
      const deliveredOrders = await Order.countDocuments({ 'items.storeId': storeId, deliveryStatus: 'Delivered' });

      const revenueResult = await Order.aggregate([
        { $match: { deliveryStatus: { $ne: 'Cancelled' }, 'items.storeId': storeId } },
        { $unwind: '$items' },
        { $match: { 'items.storeId': storeId } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Find assigned store owner
      const owner = await User.findOne({ role: 'store_owner', assignedStoreId: storeId }).select('name email adminId');

      return {
        _id: store._id,
        name: store.name,
        address: store.address,
        contactNumber: store.contactNumber,
        status: store.status,
        owner: owner ? { name: owner.name, email: owner.email, adminId: owner.adminId } : null,
        totalProducts,
        lowStockProducts,
        outOfStock,
        totalStock: totalStock.length > 0 ? totalStock[0].total : 0,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue
      };
    }));

    const summary = {
      totalStores: stores.length,
      activeStores: stores.filter(s => s.status === 'Active').length,
      totalRevenue: storeStats.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalOrders: storeStats.reduce((sum, s) => sum + s.totalOrders, 0),
      totalProducts: storeStats.reduce((sum, s) => sum + s.totalProducts, 0)
    };

    res.json({ summary, stores: storeStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 2. CUSTOMER MANAGEMENT
// ==========================================
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Enrich with dynamic order totals
    const customerList = await Promise.all(customers.map(async (cust) => {
      const orders = await Order.find({ 'customer.email': cust.email });
      const totalSpent = orders
        .filter(o => o.deliveryStatus !== 'Cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        ...cust.toObject(),
        totalOrders: orders.length,
        totalSpent
      };
    }));

    res.json(customerList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/customers/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({
      message: `Customer ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/customers/:id/orders', protect, adminOnly, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const orders = await Order.find({ 'customer.email': customer.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 3. DELIVERY PARTNERS FLEET MANAGEMENT
// ==========================================
router.get('/delivery-partners', protect, adminOnly, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({}).sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/delivery-partners', protect, adminOnly, async (req, res) => {
  try {
    const { name, phone, email, vehicleNumber, vehicleType, zone, status } = req.body;
    if (!name || !phone || !vehicleNumber) {
      return res.status(400).json({ message: 'Name, Phone, and Vehicle Number are required.' });
    }

    const partner = new DeliveryPartner({
      name,
      phone,
      email,
      vehicleNumber,
      vehicleType: vehicleType || 'Bike',
      zone: zone || 'Vijayawada Central',
      status: status || 'Available'
    });

    const saved = await partner.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/delivery-partners/:id', protect, adminOnly, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });

    Object.assign(partner, req.body);
    const updated = await partner.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/delivery-partners/:id', protect, adminOnly, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });

    await partner.deleteOne();
    res.json({ message: 'Delivery partner deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign Delivery Partner to Order
router.put('/orders/:id/assign-partner', protect, adminOnly, async (req, res) => {
  try {
    const { partnerId, partnerName, partnerPhone, vehicleNumber, deliveryStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.assignedPartner = {
      id: partnerId,
      name: partnerName,
      phone: partnerPhone,
      vehicleNumber: vehicleNumber
    };

    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
    } else if (order.deliveryStatus === 'Pending' || order.deliveryStatus === 'Confirmed') {
      order.deliveryStatus = 'Out For Delivery';
    }

    const updatedOrder = await order.save();

    // Increment partner's active order count
    if (partnerId) {
      await DeliveryPartner.findByIdAndUpdate(partnerId, {
        status: 'On Delivery',
        $inc: { activeOrdersCount: 1 }
      });
    }

    // Create Notification
    await Notification.create({
      title: 'Partner Assigned',
      message: `Order #${order.orderId} assigned to rider ${partnerName}. Status: ${order.deliveryStatus}`,
      type: 'delivery',
      orderId: order.orderId,
      priority: 'medium'
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 4. INVENTORY MANAGEMENT & QUICK RESTOCK
// ==========================================
router.get('/inventory', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let products;
    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      products = await Product.find({ storeId: req.user.assignedStoreId }).sort({ stockQuantity: 1 });
    } else {
      products = await Product.find({}).sort({ stockQuantity: 1 });
    }
    const totalInventoryCount = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.price || 0)), 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= 10).length;
    const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

    res.json({
      totalProducts: products.length,
      totalInventoryCount,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/inventory/:id/stock', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    const { stockQuantity, adjustment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      if (product.storeId?.toString() !== req.user.assignedStoreId.toString()) {
        return res.status(403).json({ message: 'Access denied: You can only adjust stock for your own store products.' });
      }
    }

    if (adjustment !== undefined) {
      product.stockQuantity = Math.max(0, (product.stockQuantity || 0) + Number(adjustment));
    } else if (stockQuantity !== undefined) {
      product.stockQuantity = Math.max(0, Number(stockQuantity));
    }

    product.inStock = product.stockQuantity > 0;
    const updated = await product.save();

    // Trigger notification if low stock or restocked
    if (product.stockQuantity <= 10 && product.stockQuantity > 0) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is low in stock (${product.stockQuantity} units left).`,
        type: 'inventory',
        productId: product._id,
        storeId: product.storeId || null,
        priority: 'high'
      });
    }

    res.json({
      message: `Stock updated for "${product.name}"`,
      product: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 5. CATEGORIES MANAGEMENT
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ sortOrder: 1, createdAt: 1 });
    
    // Auto-update itemCount dynamically from active Products
    const enriched = await Promise.all(categories.map(async (cat) => {
      const count = await Product.countDocuments({
        $or: [
          { category: cat.name },
          { subcategory: { $in: [cat.name, ...(cat.subcategories || [])] } }
        ]
      });
      return {
        ...cat.toObject(),
        itemCount: count
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, image, subcategories, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = new Category({
      name: name.trim(),
      slug,
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      subcategories: Array.isArray(subcategories) ? subcategories : (typeof subcategories === 'string' ? subcategories.split(',').map(s => s.trim()).filter(Boolean) : []),
      isActive: isActive !== undefined ? isActive : true
    });

    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/categories/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (req.body.name) {
      category.name = req.body.name.trim();
      category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.body.image) category.image = req.body.image;
    if (req.body.subcategories) {
      category.subcategories = Array.isArray(req.body.subcategories)
        ? req.body.subcategories
        : (typeof req.body.subcategories === 'string' ? req.body.subcategories.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
    if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/categories/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 6. PAYMENTS LEDGER & SETTLEMENTS
// ==========================================
router.get('/payments', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    const totalCollected = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const pendingCollection = orders
      .filter(o => o.paymentStatus === 'Pending' && o.deliveryStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const codCount = orders.filter(o => o.paymentMethod === 'COD').length;
    const upiCount = orders.filter(o => o.paymentMethod?.includes('UPI')).length;
    const cardCount = orders.filter(o => o.paymentMethod === 'Razorpay').length;

    res.json({
      totalCollected,
      pendingCollection,
      methodBreakdown: {
        cod: codCount,
        upi: upiCount,
        razorpay: cardCount
      },
      transactions: orders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        customerName: o.customer?.name || 'Customer',
        customerPhone: o.customer?.phone || '',
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus || 'Pending',
        deliveryStatus: o.deliveryStatus,
        date: o.orderDate || o.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/payments/:orderId/status', protect, adminOnly, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = paymentStatus;
    const updated = await order.save();
    res.json({ message: `Payment status updated to ${paymentStatus}`, order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 7. NOTIFICATIONS CENTER
// ==========================================
router.get('/notifications', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      query = { $or: [{ storeId: req.user.assignedStoreId }, { storeId: null }] };
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });
    res.json({ unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/notifications/:id/read', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      if (notif.storeId && notif.storeId.toString() !== req.user.assignedStoreId.toString()) {
        return res.status(403).json({ message: 'Access denied: You cannot mark notifications from other stores as read.' });
      }
    }

    notif.isRead = true;
    await notif.save();
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/notifications/read-all', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let query = { isRead: false };
    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      query = { isRead: false, $or: [{ storeId: req.user.assignedStoreId }, { storeId: null }] };
    }
    await Notification.updateMany(query, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 8. STORE SETTINGS & ADMIN PROFILE
// ==========================================
router.get('/settings', protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      settings = await Setting.create({
        storeName: 'QuickFit Menswear Vijayawada',
        contactEmail: 'admin@quickfit.com',
        supportPhone: '+91 7396629821',
        storeAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
        currency: 'INR',
        currencySymbol: '₹',
        deliveryFee: 49,
        freeDeliveryThreshold: 999,
        lowStockThreshold: 10,
        taxPercent: 5
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    const saved = await settings.save();
    res.json({ message: 'Settings saved successfully', settings: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/change-password', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const admin = await User.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: 'User not found' });

    if (currentPassword) {
      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// STORE MANAGEMENT (ADMIN CRUD)
// ==========================================

// GET all stores — Super Admin sees all; Store Owner sees only their assigned store
router.get('/stores', protect, storeOwnerOrAdmin, async (req, res) => {
  try {
    let stores;
    if (req.user.role === 'store_owner' && req.user.assignedStoreId) {
      // Store owner can only see their own store
      const store = await Store.findById(req.user.assignedStoreId);
      stores = store ? [store] : [];
    } else {
      stores = await Store.find({}).sort({ createdAt: -1 });
    }
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create store (Super Admin only)
router.post('/stores', protect, adminOnly, async (req, res) => {
  try {
    const { name, address, contactNumber, location, deliveryRadiusKm, status } = req.body;

    if (!name || !address || !contactNumber || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: 'Name, address, contact number, and location (lat/lng) are required.' });
    }

    const store = new Store({
      name: name.trim(),
      address: address.trim(),
      contactNumber: contactNumber.trim(),
      location: { lat: Number(location.lat), lng: Number(location.lng) },
      deliveryRadiusKm: deliveryRadiusKm ? Number(deliveryRadiusKm) : 10,
      status: status || 'Active'
    });

    const created = await store.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update store (Super Admin only)
router.put('/stores/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, address, contactNumber, location, deliveryRadiusKm, status } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found.' });

    if (name) store.name = name.trim();
    if (address) store.address = address.trim();
    if (contactNumber) store.contactNumber = contactNumber.trim();
    if (location?.lat !== undefined) store.location.lat = Number(location.lat);
    if (location?.lng !== undefined) store.location.lng = Number(location.lng);
    if (deliveryRadiusKm !== undefined) store.deliveryRadiusKm = Number(deliveryRadiusKm);
    if (status) store.status = status;

    const updated = await store.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE store (Super Admin only)
router.delete('/stores/:id', protect, adminOnly, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found.' });
    res.json({ message: `Store "${store.name}" deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// STORE OWNER MANAGEMENT (Super Admin only)
// ==========================================

// GET all store owner accounts
router.get('/store-owners', protect, adminOnly, async (req, res) => {
  try {
    const owners = await User.find({ role: 'store_owner' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Enrich with store info
    const enriched = await Promise.all(owners.map(async (owner) => {
      const store = owner.assignedStoreId
        ? await Store.findById(owner.assignedStoreId).select('name address status')
        : null;
      return {
        ...owner.toObject(),
        store: store || null
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create/update store owner account for a specific store
router.post('/store-owners', protect, adminOnly, async (req, res) => {
  try {
    const { storeId, name, email, adminId, password, phone } = req.body;

    if (!storeId || !name || !email || !password) {
      return res.status(400).json({ message: 'Store ID, name, email, and password are required.' });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: 'Store not found.' });

    // Check if adminId is already taken by another user
    if (adminId) {
      const existingAdminId = await User.findOne({ adminId: { $regex: new RegExp(`^${adminId}$`, 'i') } });
      if (existingAdminId) {
        return res.status(400).json({ message: `Admin ID "${adminId}" is already taken.` });
      }
    }

    // Check if email is already taken
    const existingEmail = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingEmail) {
      return res.status(400).json({ message: `Email "${email}" is already registered.` });
    }

    const owner = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone || store.contactNumber,
      role: 'store_owner',
      assignedStoreId: storeId,
      adminId: adminId ? adminId.trim() : undefined,
      address: {
        street: store.address,
        area: 'Vijayawada',
        city: 'Vijayawada'
      }
    });

    const saved = await owner.save();
    res.status(201).json({
      _id: saved._id,
      name: saved.name,
      email: saved.email,
      adminId: saved.adminId,
      phone: saved.phone,
      role: saved.role,
      assignedStoreId: saved.assignedStoreId,
      store: { _id: store._id, name: store.name }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update store owner credentials
router.put('/store-owners/:id', protect, adminOnly, async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'store_owner') {
      return res.status(404).json({ message: 'Store owner account not found.' });
    }

    const { name, email, adminId, password, phone, storeId, isBlocked } = req.body;

    if (name && name.trim()) owner.name = name.trim();

    if (email && email.trim().toLowerCase() !== (owner.email || '').toLowerCase()) {
      const existingEmail = await User.findOne({
        _id: { $ne: owner._id },
        email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
      });
      if (existingEmail) {
        return res.status(400).json({ message: `Email "${email}" is already registered.` });
      }
      owner.email = email.trim().toLowerCase();
    }

    if (adminId !== undefined) {
      const trimmedId = adminId ? adminId.trim() : '';
      if (trimmedId && trimmedId !== (owner.adminId || '')) {
        const existingAdminId = await User.findOne({
          _id: { $ne: owner._id },
          adminId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
        });
        if (existingAdminId) {
          return res.status(400).json({ message: `Admin ID "${trimmedId}" is already taken.` });
        }
        owner.adminId = trimmedId;
      } else if (!trimmedId) {
        owner.adminId = undefined;
      }
    }

    if (phone !== undefined) owner.phone = phone.trim();
    if (storeId) owner.assignedStoreId = storeId;
    if (isBlocked !== undefined) owner.isBlocked = Boolean(isBlocked);

    if (password && password.trim().length >= 6) {
      owner.password = password.trim(); // User pre-save hook will hash it
    }

    const updated = await owner.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      adminId: updated.adminId,
      phone: updated.phone,
      role: updated.role,
      assignedStoreId: updated.assignedStoreId,
      isBlocked: updated.isBlocked
    });
  } catch (error) {
    console.error('❌ [Store Owner Update Error]:', error.message);
    res.status(400).json({ message: error.message || 'Failed to update store owner account.' });
  }
});

// DELETE store owner account
router.delete('/store-owners/:id', protect, adminOnly, async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'store_owner') {
      return res.status(404).json({ message: 'Store owner not found.' });
    }
    await owner.deleteOne();
    res.json({ message: `Store owner account for "${owner.name}" deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
