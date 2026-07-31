# QuickFit - Hyperlocal Fashion Delivery Platform
## Vijayawada 60-Minute Express Fashion Delivery

A complete **production-ready MERN stack** fashion delivery platform — inspired by Flipkart, Myntra, and Blinkit Fashion — built for **Vijayawada, India**.

---

## 🏗️ Architecture

```
quickfit/
├── client/          ← React + Vite + TailwindCSS v4 (Frontend)
│   └── src/
│       ├── components/   (ProductCard, Navbar, CheckoutModal, AdminDashboardModal, etc.)
│       ├── context/      (ShopContext.jsx - global state + API integration)
│       └── data/         (products.js - fallback catalog data)
└── server/          ← Node.js + Express + MongoDB (Backend)
    └── src/
        ├── models/       (User, Product, Order)
        ├── routes/       (auth, products, orders, admin)
        ├── middleware/   (JWT auth, Admin guard)
        └── utils/        (Email notifications via Nodemailer)
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js v18+
- **MongoDB** (Community Edition installed locally **or** MongoDB Atlas cloud URI)
- npm

### Step 1: Install MongoDB locally
Download from https://www.mongodb.com/try/download/community  
OR use MongoDB Atlas (free tier) and update `MONGODB_URI` in `server/.env`

### Step 2: Install Dependencies
```bash
# From project root
cd client && npm install
cd ../server && npm install
```

### Step 3: Configure Environment Variables
```bash
# Copy and edit server .env
# server/.env already has defaults for local dev
# Update MONGODB_URI if using Atlas Cloud:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickfit
```

### Step 4: Start Both Servers
Open **two terminals**:

**Terminal 1 — Backend (Port 5000):**
```bash
cd server
npm run dev
```
Expected output:
```
[MongoDB Connected]: 127.0.0.1
[Seeder]: Admin Created -> Email: saggurthisubbu9@gmail.com | Password: admin123password
[Seeder]: Inserted 4 initial Vijayawada boutique products.
🚀 [QuickFit Backend Server]: Running on http://localhost:5000
```

**Terminal 2 — Frontend (Port 3000):**
```bash
cd client
npm run dev
```
Expected output:
```
VITE v8.1.5  ready in 419 ms
Local:   http://localhost:3000/
```

---

## 🔑 Admin Panel Access

1. Click **"🔑 Admin Dashboard"** button in the top navbar
2. Login with:
   - **Email:** `saggurthisubbu9@gmail.com`
   - **Password:** `admin123password`

### Admin Features:
| Feature | Description |
|---------|-------------|
| **Dashboard Overview** | Total Revenue, Orders, Customers, Low Stock Alerts |
| **Product Management** | Add, View, Delete products with stock quantity |
| **Order Management** | View all orders, update delivery status (Pending → Delivered) |
| **Customer Management** | View registered users, Block/Unblock accounts |
| **Inventory Alerts** | Automatic low stock warnings (≤10 units) |

---

## 📦 Order Flow (Automatic Stock Management)

1. Customer adds product to cart → Checkout
2. Backend API receives order:
   - Validates stock availability
   - **Automatically deducts stock** from MongoDB
   - Sets product to "Out of Stock" when qty = 0
   - Saves full order record
3. **Nodemailer Email** notification sent to `saggurthisubbu9@gmail.com`
4. **WhatsApp notification** URL opens for `+91 7396629821`
5. Admin can update order status from Dashboard

---

## 🔌 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register new customer |
| POST | `/api/auth/login` | Public | Login (Customer or Admin) |
| GET | `/api/products` | Public | Get all products |
| POST | `/api/products` | Admin | Add new product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/orders` | Public | Place new order (deducts stock) |
| GET | `/api/orders` | Admin | Get all orders |
| PUT | `/api/orders/:id/status` | Admin | Update delivery status |
| GET | `/api/admin/analytics` | Admin | Dashboard metrics |
| GET | `/api/admin/customers` | Admin | List all customers |
| PUT | `/api/admin/customers/:id/block` | Admin | Block/Unblock customer |

---

## 🌐 Environment Variables Reference

### `server/.env`
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickfit
JWT_SECRET=quickfit_super_secret_jwt_key_2026_vijayawada
EMAIL_USER=saggurthisubbu9@gmail.com
EMAIL_PASS=your_gmail_app_password_here
ADMIN_EMAIL=saggurthisubbu9@gmail.com
ADMIN_PHONE=+91 7396629821
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords. Generate a 16-character app password for "Mail" and paste in `EMAIL_PASS`.

---

## 💳 Payment Methods Supported
- **Cash on Delivery (COD)** — Pay when rider arrives
- **UPI / GPay / PhonePe** — Scan QR at delivery
- **Card on Delivery** — Rider carries POS machine

---

## 🚢 Deployment (Vercel + Render)

**Frontend → Vercel:**
- Connect GitHub repo, select `client/` as root directory
- Add `VITE_API_URL` env variable pointing to your Render backend URL

**Backend → Render:**
- Connect GitHub repo, select `server/` as root directory  
- Add all `.env` variables in Render Dashboard
- Set `MONGODB_URI` to your MongoDB Atlas connection string

---

## 📱 WhatsApp Business Integration
- **Business Number**: +91 7396629821
- Orders automatically generate WhatsApp deep link with full order details
- Customer is redirected to WhatsApp to confirm their order message

---

## 📧 Email Notifications
Uses **Nodemailer** with Gmail SMTP.  
Configure `EMAIL_PASS` (Gmail App Password) in `server/.env` to activate.  
Without it, the server logs a mock confirmation (safe for development).

---

*QuickFit Vijayawada Express — Fashion in 60 Minutes* ⚡
