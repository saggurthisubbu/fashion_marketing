import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// CORS — allow all origins (Vercel, mobile, localhost) and all headers used by the frontend
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Some browsers (Safari) require 200 not 204 for preflight
};
app.use(cors(corsOptions));

// Explicit OPTIONS preflight handler — must be before all routes
app.options('*', cors(corsOptions));

app.use(express.json());

// Auto-ensure MongoDB Connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ [Database Middleware Error]:', err.message);
    res.status(500).json({ message: 'Database connection error' });
  }
});

// Ensure and serve uploaded static files
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/search', searchRoutes);

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'QuickFit Hyperlocal Express API',
    city: 'Vijayawada',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler for Unmatched API Endpoints — Always return JSON, never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Express Error Handler for API Routes — Always return JSON
app.use((err, req, res, next) => {
  console.error('❌ [API Unhandled Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const DEFAULT_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://quickfitfashion.in/</loc>
    <lastmod>2026-09-09</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quickfitfashion.in/search</loc>
    <lastmod>2026-09-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

const DEFAULT_ROBOTS_TXT = `# https://www.robotstxt.org/robotstxt.html
# Robots.txt for QuickFit Fashion (https://quickfitfashion.in/)

User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: Googlebot-Image
Allow: /
Allow: /icons/
Allow: /uploads/
Allow: /placeholder-product.*

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# Sitemap location
Sitemap: https://quickfitfashion.in/sitemap.xml
Sitemap: https://www.quickfitfashion.in/sitemap.xml
`;

// Serve robots.txt and sitemap.xml for search engines & Googlebot
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const robotsClientDist = path.join(__dirname, '../../client/dist/robots.txt');
  const robotsClientPublic = path.join(__dirname, '../../client/public/robots.txt');
  const target = fs.existsSync(robotsClientDist) ? robotsClientDist : robotsClientPublic;
  if (fs.existsSync(target)) {
    return res.sendFile(target);
  }
  return res.send(DEFAULT_ROBOTS_TXT);
});

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const sitemapClientDist = path.join(__dirname, '../../client/dist/sitemap.xml');
  const sitemapClientPublic = path.join(__dirname, '../../client/public/sitemap.xml');
  const target = fs.existsSync(sitemapClientDist) ? sitemapClientDist : sitemapClientPublic;
  if (fs.existsSync(target)) {
    return res.sendFile(target);
  }
  return res.send(DEFAULT_SITEMAP_XML);
});

// Serve built frontend assets if available (Unified Full-Stack Deployment)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback: any non-API request serves index.html to support direct /admin access without 404s
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // If client is not built, provide a direct fallback for /admin route
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #09090b; color: #fff; min-height: 100vh;">
        <h1 style="font-size: 28px; margin-bottom: 12px;">⚡ QuickFit Express API Server</h1>
        <p style="color: #a1a1aa; font-size: 14px;">Backend API is ONLINE and connected to MongoDB Atlas.</p>
        <p style="margin-top: 24px;"><a href="/api/health" style="color: #60a5fa; text-decoration: none;">View API Health Status &rarr;</a></p>
      </div>
    `);
  });
}

export default app;

