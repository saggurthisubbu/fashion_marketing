import express from 'express';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get Admin Analytics Dashboard Summary
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const pendingOrders = await Order.countDocuments({ deliveryStatus: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ deliveryStatus: 'Delivered' });

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { deliveryStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Low stock products (quantity <= 10)
    const lowStockProducts = await Product.find({ stockQuantity: { $lte: 10 } }).select('name stockQuantity inStock price boutique');

    // Sales by Category
    const salesByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      salesByCategory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer Management: List all customers
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer Management: Toggle Block / Unblock customer
router.put('/customers/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `Customer ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
