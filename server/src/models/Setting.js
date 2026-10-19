import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: 'QuickFit Menswear' },
  contactEmail: { type: String, default: 'admin@quickfit.com' },
  supportPhone: { type: String, default: '+91 7396629821' },
  storeAddress: { type: String, default: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  deliveryFee: { type: Number, default: 49 },
  freeDeliveryThreshold: { type: Number, default: 999 },
  lowStockThreshold: { type: Number, default: 10 },
  taxPercent: { type: Number, default: 5 },
  expressDeliveryTime: { type: String, default: '45-60 Mins' },
  liveTrackingEnabled: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  heroShowcaseProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  offer: {
    isActive: { type: Boolean, default: true },
    offerName: { type: String, default: 'Special Flat ₹200 Discount' },
    couponCode: { type: String, default: 'QUICK200' },
    discountAmount: { type: Number, default: 200 },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null }
  }
}, { timestamps: true });

export const Setting = mongoose.model('Setting', settingSchema);
