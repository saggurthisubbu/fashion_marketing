import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { sendEmailNotification } from '../utils/notifications.js';

const router = express.Router();

// Create new order (Public or Customer)
router.post('/', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, locationLink } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 1. Verify stock availability and deduct stock automatically
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

    // 2. Generate unique 6-digit Order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `QF-VJ-${randomSuffix}`;

    const order = new Order({
      orderId,
      customer,
      items,
      totalAmount,
      paymentMethod,
      locationLink: locationLink || '',
      deliveryStatus: 'Confirmed'
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

    // 4. Trigger Email notification to admin (configured in env)
    sendEmailNotification(createdOrder);

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

// Admin: Get all orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.deliveryStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
