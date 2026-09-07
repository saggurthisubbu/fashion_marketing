import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 5000;

// Connect to DB, seed defaults, and listen on all network interfaces (0.0.0.0)
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n===============================================================`);
    console.log(`🚀 [QuickFit Backend Server]: Running on http://localhost:${PORT}`);
    console.log(`===============================================================`);
    console.log(`🎯 FRONTEND ADMIN URLS:`);
    console.log(`   • Admin Dashboard : http://localhost:5173/admin`);
    console.log(`   • Admin Login     : http://localhost:5173/admin/login`);
    console.log(`   • Store Catalog   : http://localhost:5173/`);
    console.log(`---------------------------------------------------------------`);
    console.log(`🛠️ AVAILABLE ADMIN API ENDPOINTS:`);
    console.log(`   • POST /api/auth/login                - Admin & Store Owner Login`);
    console.log(`   • GET  /api/admin/analytics           - Executive KPI Dashboard Metrics`);
    console.log(`   • GET  /api/admin/store-analytics     - Store-by-Store Analytics`);
    console.log(`   • GET  /api/admin/customers           - Customers List`);
    console.log(`   • PUT  /api/admin/customers/:id/block - Block/Unblock Customer`);
    console.log(`   • GET  /api/admin/delivery-partners   - Delivery Partners Fleet`);
    console.log(`   • POST /api/admin/delivery-partners   - Create Delivery Driver`);
    console.log(`   • PUT  /api/orders/:id/assign-partner - Assign Delivery Driver`);
    console.log(`   • GET  /api/admin/inventory           - Stock Levels & Low Stock`);
    console.log(`   • PUT  /api/admin/inventory/:id/stock - Stock Adjustment`);
    console.log(`   • GET  /api/admin/categories          - Categories List`);
    console.log(`   • POST /api/admin/categories          - Create Category`);
    console.log(`   • PUT  /api/admin/categories/:id      - Update Category`);
    console.log(`   • DELETE /api/admin/categories/:id    - Delete Category`);
    console.log(`   • GET  /api/admin/payments            - Revenue & Transactions`);
    console.log(`   • GET  /api/admin/notifications       - Order & Stock Notifications`);
    console.log(`   • GET  /api/admin/settings            - Platform Settings`);
    console.log(`   • PUT  /api/admin/settings            - Update Platform Settings`);
    console.log(`   • GET  /api/admin/stores              - Boutique Stores Directory`);
    console.log(`   • POST /api/admin/stores              - Add New Boutique Store`);
    console.log(`   • GET  /api/admin/store-owners        - Store Managers Credentials`);
    console.log(`   • GET  /api/products                  - Products Catalog (Admin/Public)`);
    console.log(`   • POST /api/products                  - Add 4-Angle Product`);
    console.log(`   • PUT  /api/products/:id              - Edit Product SKU`);
    console.log(`   • DELETE /api/products/:id            - Delete Product SKU`);
    console.log(`   • GET  /api/orders                    - Order Processing Stream`);
    console.log(`   • PUT  /api/orders/:id/status         - Update Order Status`);
    console.log(`===============================================================\n`);
  });
});
