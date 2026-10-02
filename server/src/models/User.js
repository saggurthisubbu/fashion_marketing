import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, sparse: true, index: true, lowercase: true, trim: true },
  adminId: { type: String, sparse: true },
  password: {
    type: String,
    required: function () {
      return this.role === 'admin' || this.role === 'store_owner';
    }
  },
  phone: { type: String, required: true, index: true },
  role: { type: String, enum: ['customer', 'admin', 'store_owner'], default: 'customer' },
  assignedStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  address: {
    street: { type: String, default: '' },
    area: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '520010' },
    city: { type: String, default: 'Vijayawada' },
    fullAddress: { type: String, default: '' }
  },
  emailStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  welcomeEmailSentAt: { type: Date },
  isBlocked: { type: Boolean, default: false },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  registrationDate: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
