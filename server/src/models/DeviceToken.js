import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'store_owner', 'customer'],
    default: 'admin'
  },
  assignedStoreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceType: {
    type: String,
    enum: ['android', 'ios', 'web', 'unknown'],
    default: 'unknown'
  },
  platform: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
