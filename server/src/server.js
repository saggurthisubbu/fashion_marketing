import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'QuickFit Hyperlocal Express API',
    city: 'Vijayawada',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Connect to DB, seed defaults, and listen
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 [QuickFit Backend Server]: Running on http://localhost:${PORT}`);
  });
});
