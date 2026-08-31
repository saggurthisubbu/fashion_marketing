import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['order', 'inventory', 'customer', 'delivery', 'system'],
    default: 'system'
  },
  orderId: { type: String },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
