import express from 'express';
import { Store } from '../models/Store.js';

const router = express.Router();

// Public: Get all active stores (used by checkout for delivery radius validation)
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find({ status: 'Active' }).select(
      'name address location deliveryRadiusKm status'
    );
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
