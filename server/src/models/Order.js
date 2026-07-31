import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String },
  color: { type: String },
  image: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    landmark: String,
    pincode: { type: String, default: '520010' },
    area: { type: String, default: 'MG Road' }
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['COD', 'UPI (GPay/PhonePe)', 'Razorpay'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryEta: { type: String, default: '45 Mins' },
  orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
