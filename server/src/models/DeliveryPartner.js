import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  vehicleNumber: { type: String, required: true },
  vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Electric Bike', 'Van'], default: 'Bike' },
  status: {
    type: String,
    enum: ['Available', 'On Delivery', 'Offline'],
    default: 'Available'
  },
  zone: { type: String, default: 'Vijayawada Central' },
  activeOrdersCount: { type: Number, default: 0 },
  completedDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 4.9 },
  joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
