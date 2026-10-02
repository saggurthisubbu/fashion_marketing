import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'quickfit_super_secret_jwt_key_2026_vijayawada', {
    expiresIn: '30d'
  });
};

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
