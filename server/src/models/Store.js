import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  deliveryRadiusKm: {
    type: Number,
    default: 10,
    min: 0.5,
    max: 500
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

export const Store = mongoose.model('Store', storeSchema);
