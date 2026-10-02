import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { protect } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'quickfit_super_secret_jwt_key_2026_vijayawada', {
    expiresIn: '30d'
  });
};

const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

// ─── 1. CUSTOMER OTP FLOW ─────────────────────────────────────────────────────

// Send OTP to customer phone
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const cleanPhone = normalizePhone(phone);

  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
  }

  try {
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear old OTPs for this phone and insert new one
    await Otp.deleteMany({ phone: cleanPhone });
    await Otp.create({ phone: cleanPhone, otp });

    console.log(`\n🔑 =======================================================`);
    console.log(`   [QuickFit Customer OTP]: Verification Code for +91 ${cleanPhone}`);
    console.log(`   OTP: >>  ${otp}  <<`);
    console.log(`   Expires in 10 minutes`);
    console.log(`=======================================================\n`);

    res.json({
      success: true,
      message: `OTP sent to +91 ${cleanPhone}`,
      phone: cleanPhone,
      otp // Included in response for seamless local testing & demo
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    res.status(500).json({ message: 'Failed to generate OTP. Please try again.' });
  }
});

// Verify OTP & Load Customer Details
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = normalizePhone(phone);

  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
  }

  const cleanOtp = String(otp || '').trim();
  if (!cleanOtp) {
    return res.status(400).json({ message: 'Please enter the 6-digit OTP' });
  }

  try {
    const otpRecord = await Otp.findOne({ phone: cleanPhone, otp: cleanOtp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please check and try again.' });
    }

    // Delete verified OTP record
    await Otp.deleteMany({ phone: cleanPhone });

    // Look for existing customer by phone number
    let user = await User.findOne({
      role: 'customer',
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` },
        { phone: `+91 ${cleanPhone}` },
        { phone: new RegExp(`${cleanPhone}$`) }
      ]
    });

    let isReturningCustomer = false;

    if (!user) {
      // Create new customer account
      user = await User.create({
        phone: cleanPhone,
        role: 'customer',
        name: '',
        address: {
          street: '',
          area: '',
          landmark: '',
          pincode: '520010',
          city: 'Vijayawada',
          fullAddress: ''
        }
      });
    } else {
      isReturningCustomer = Boolean(user.name && user.name.trim());
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been blocked. Contact QuickFit support.' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name || '',
      phone: user.phone || cleanPhone,
      email: user.email && !user.email.endsWith('@customer.quickfit.in') ? user.email : '',
      address: user.address || {},
      role: user.role || 'customer',
      isReturningCustomer,
      token,
      message: isReturningCustomer ? `Welcome back, ${user.name}! Saved details loaded.` : 'Phone verified successfully.'
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Customer Profile (Name, Email, Address, Phone)
router.put('/customer-profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { name, email, phone, address } = req.body;
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined && email.trim()) user.email = email.trim().toLowerCase();
    if (phone !== undefined && phone.trim()) {
      const clean = normalizePhone(phone);
      if (clean.length === 10) user.phone = clean;
    }

    if (address !== undefined) {
      if (typeof address === 'string') {
        const full = address.trim();
        user.address = {
          street: full,
          area: user.address?.area || '',
          landmark: user.address?.landmark || '',
          pincode: user.address?.pincode || '520010',
          city: user.address?.city || 'Vijayawada',
          fullAddress: full
        };
      } else if (typeof address === 'object' && address !== null) {
        user.address = {
          street: address.street || address.fullAddress || user.address?.street || '',
          area: address.area || user.address?.area || '',
          landmark: address.landmark || user.address?.landmark || '',
          pincode: address.pincode || user.address?.pincode || '520010',
          city: address.city || user.address?.city || 'Vijayawada',
          fullAddress: address.fullAddress || address.street || user.address?.fullAddress || ''
        };
      }
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email && !user.email.endsWith('@customer.quickfit.in') ? user.email : '',
      address: user.address,
      role: user.role,
      token: generateToken(user._id),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ message: error.message });
  }
});


// Customer Register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 1. Create and save user in MongoDB
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'customer'
    });

    // 2. Automatically send Welcome Email using Nodemailer SMTP after user is saved
    // Safe & non-blocking: Account creation remains successful even if SMTP fails
    sendWelcomeEmail(user).catch((emailErr) => {
      console.error('[Welcome Email Background Trigger Error]:', emailErr.message);
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      message: 'Account created successfully. A welcome email has been sent.',
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login (Customer or Admin - supports entering Admin ID e.g. 'admin' or Email)
router.post('/login', async (req, res) => {
  const { email, identifier, adminId, password } = req.body;
  const loginKey = (identifier || adminId || email || '').trim();

  if (!loginKey || !password) {
    return res.status(400).json({ message: 'Please provide Login ID/Email and Password' });
  }

  try {
    // Search user by email, adminId, or lowercase match
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${loginKey}$`, 'i') } },
        { adminId: { $regex: new RegExp(`^${loginKey}$`, 'i') } },
        { name: { $regex: new RegExp(`^${loginKey}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid Admin ID / Email or Password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account blocked by Admin. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Admin ID / Email or Password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      adminId: user.adminId || (user.role === 'admin' ? 'admin' : undefined),
      phone: user.phone,
      role: user.role,
      assignedStoreId: user.assignedStoreId || null,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

export default router;
