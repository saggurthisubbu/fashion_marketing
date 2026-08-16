# QuickFit Hyperlocal Express - Permanent Access & Deployment Document

## 🌐 Production & Local Access URLs

| Portal | Link | Route / Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Customer Storefront** | [QuickFit Storefront](https://quickfit-app.vercel.app/) *(or local `http://localhost:3000`)* | `/` | Hyperlocal luxury menswear catalog, real-time cart, 60-min express checkout |
| **Admin Dashboard (Permanent)** | [QuickFit Admin Portal](https://quickfit-app.vercel.app/admin) *(or local `http://localhost:3000/admin`)* | `/admin` | Dedicated executive store management suite (Orders, Stock, Products, Metrics) |
| **Live Backend API** | [Render Backend API](https://quickfit-backend-m1yl.onrender.com/api) | `/api` | Node.js + Express API connected to MongoDB Atlas |
| **API Health Status** | [API Health Check](https://quickfit-backend-m1yl.onrender.com/api/health) | `/api/health` | Live cluster connectivity and system diagnostics |

---

## 🔑 Administrator Credentials

| Field | Primary Admin (Full Access) | Quick Test Admin Alias |
| :--- | :--- | :--- |
| **Login Identifier** | `saggurthisubbu9@gmail.com` *(or `admin`)* | `admin@quickfit.com` |
| **Password** | `QuickFitAdmin@2026!` | `admin123` |
| **Role** | `admin` | `admin` |
| **Contact Phone** | `+91 7396629821` | `+91 7396629821` |
| **Authentication Type** | JWT Bearer Token (30-day session) | JWT Bearer Token (30-day session) |

---

## 🚀 How to Access the Admin Dashboard

### Option 1: Direct Permanent URL
1. Open your browser and navigate directly to:
   - **Production:** `https://your-domain.com/admin` (or `/#admin`)
   - **Local Dev:** `http://localhost:3000/admin`
   - **Local Unified Server:** `http://localhost:5000/admin`
2. The restricted Admin Access screen will appear immediately.
3. Enter your Admin Email (`saggurthisubbu9@gmail.com`) and Password (`QuickFitAdmin@2026!`).
4. You are instantly logged in and redirected into the executive suite.

### Option 2: Visible Admin Button (For Logged-In Administrators)
1. Sign in with your administrator account via the customer **Sign In** modal.
2. Once signed in, a high-contrast **"⚡ Go to Admin Dashboard"** button automatically appears:
   - In the **Top Announcement Bar** (top right)
   - In the **Main Desktop Navbar** (next to cart)
   - In the **Mobile Menu Drawer** (top quick-launch banner)
   - Inside your **My Account Profile** modal
3. Click the button to switch directly to `/admin` at any time.

---

## 📊 Executive Dashboard Home Features

The Admin Dashboard Home page provides instant real-time visibility into:
1. 🛍️ **Total Products**: Live catalog inventory count across all collections.
2. 📦 **Total Orders**: Lifetime customer order volume and fulfillment status.
3. 👥 **Total Customers**: Registered customer account database.
4. 💰 **Revenue Summary**: Total store revenue (₹ INR), Average Order Value, and 7-day sales trend charts.
5. ⚠️ **Low Stock Warnings**: Automatic alerts when product inventory drops to $\le 10$ units.
6. 🚚 **Delivery Partner Fleet**: Rider dispatch status across Vijayawada zones.

---

## 🚢 Permanent Deployment Instructions

### Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL = https://quickfit-backend-m1yl.onrender.com/api`
- *Rewrites*: Automatically handled by `vercel.json` so `/admin` never 404s.

### Backend (Render / VPS / Unified Server)
- **Environment**: Node.js
- **Build Command**: `npm install --prefix server`
- **Start Command**: `npm start --prefix server`
- **Environment Variables**:
  - `PORT`: `5000`
  - `MONGODB_URI`: `mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority`
  - `JWT_SECRET`: `quickfit_super_secret_jwt_key_2026_vijayawada`
  - `ADMIN_EMAIL`: `saggurthisubbu9@gmail.com`
  - `ADMIN_PASSWORD`: `QuickFitAdmin@2026!`
  - `ADMIN_PHONE`: `+91 7396629821`

---

## 💻 Running Locally

```bash
# Start both client and server concurrently
npm run dev

# Frontend: http://localhost:3000
# Admin Dashboard: http://localhost:3000/admin
# Backend API: http://localhost:5000/api
```
