import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';

export const AdminDashboardModal = () => {
  const { isAdminOpen, setIsAdminOpen, API_BASE_URL, showToast, user, loginUser, logoutUser, fetchProducts } = useShop();

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, customers, analytics
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('quickfit_token') || '');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('saggurthisubbu9@gmail.com');
  const [loginPassword, setLoginPassword] = useState('QuickFitAdmin@2026!');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Analytics Data
  const [analytics, setAnalytics] = useState({
    totalOrders: 12,
    totalRevenue: 48500,
    totalCustomers: 8,
    totalProducts: 4,
    pendingOrders: 2,
    deliveredOrders: 8,
    lowStockCount: 2,
    lowStockProducts: [],
    salesByCategory: []
  });

  // Data Collections
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Add/Edit Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Men',
    subcategory: 'Shirts',
    price: '',
    originalPrice: '',
    stockQuantity: 50,
    boutique: 'MG Road Trendz, Vijayawada',
    description: '',
    sizes: 'S, M, L, XL',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop'
  });

  const headers = { Authorization: `Bearer ${adminToken}` };

  // Fetch Dashboard Analytics
  const loadAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/analytics`, { headers });
      setAnalytics(res.data);
    } catch (err) {
      console.warn('Backend offline or unauthenticated for analytics');
    }
  };

  // Fetch All Admin Data
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [prodRes, orderRes, custRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/orders`, { headers }),
        axios.get(`${API_BASE_URL}/admin/customers`, { headers })
      ]);
      setProductsList(prodRes.data);
      setOrdersList(orderRes.data);
      setCustomersList(custRes.data);
      await loadAnalytics();
    } catch (err) {
      console.warn('Failed to load full admin data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminOpen && user && user.role === 'admin') {
      loadAdminData();
    }
  }, [isAdminOpen, user]);

  if (!isAdminOpen) return null;

  // Handle Admin Login Submit
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const loggedUser = await loginUser(loginEmail, loginPassword);
      if (loggedUser.role !== 'admin') {
        showToast('Access denied. This account is not an Administrator.', 'error');
        logoutUser();
        return;
      }
      setAdminToken(loggedUser.token);
      showToast('Admin Dashboard Unlocked 🔓');
      loadAdminData();
    } catch (err) {
      // Handled by shop context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Product Create Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice || productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        sizes: productForm.sizes.split(',').map(s => s.trim())
      };
      await axios.post(`${API_BASE_URL}/products`, payload, { headers });
      showToast('New Product added to QuickFit Catalog! 🛍️');
      setIsAddProductOpen(false);
      fetchProducts();
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add product', 'error');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, { headers });
      showToast('Product deleted successfully.', 'info');
      fetchProducts();
      loadAdminData();
    } catch (err) {
      showToast('Failed to delete product.', 'error');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus }, { headers });
      showToast(`Order status updated to "${newStatus}" 🚚`);
      loadAdminData();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Handle Block Customer
  const handleToggleBlockCustomer = async (custId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/admin/customers/${custId}/block`, {}, { headers });
      showToast(res.data.message);
      loadAdminData();
    } catch (err) {
      showToast('Failed to toggle block status', 'error');
    }
  };

  const isAdminAuthenticated = user && user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-black font-heading tracking-tight flex items-center gap-2">
                QuickFit Admin Control Panel
                <span className="bg-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  VIJAYAWADA HQ
                </span>
              </h2>
              <p className="text-xs text-slate-400">Hyperlocal Delivery & Inventory Management</p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminOpen(false)}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        {!isAdminAuthenticated ? (
          /* LOGIN FORM */
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🔐
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 font-heading">Admin Portal Sign In</h3>
              <p className="text-sm text-slate-500 mt-1">Authenticate to manage inventory, orders, and customers.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field"
                  placeholder="saggurthisubbu9@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg transition-all"
              >
                {isAuthLoading ? 'Authenticating...' : 'Unlock Admin Panel ➔'}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* TABS NAVIGATION */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between overflow-x-auto">
              <div className="flex items-center gap-2">
                {[
                  { id: 'overview', label: '📊 Dashboard Overview' },
                  { id: 'products', label: '👕 Product Catalog' },
                  { id: 'orders', label: '📦 Orders & Delivery' },
                  { id: 'customers', label: '👥 Customer List' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <span>+ Add Product</span>
                </button>
                <button
                  onClick={logoutUser}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* METRICS CARDS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
                      <div className="text-xs uppercase font-bold text-blue-100">Total Revenue</div>
                      <div className="text-3xl font-black font-heading mt-2">₹{analytics.totalRevenue.toLocaleString()}</div>
                      <div className="text-[11px] text-blue-100/80 mt-1">Vijayawada Sales</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="text-xs uppercase font-bold text-slate-400">Total Orders</div>
                      <div className="text-3xl font-black font-heading text-slate-900 mt-2">{analytics.totalOrders}</div>
                      <div className="text-[11px] text-emerald-600 font-bold mt-1">⚡ 60-min Guaranteed</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="text-xs uppercase font-bold text-slate-400">Registered Customers</div>
                      <div className="text-3xl font-black font-heading text-slate-900 mt-2">{analytics.totalCustomers}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Active Accounts</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="text-xs uppercase font-bold text-slate-400">Low Stock Alert</div>
                      <div className="text-3xl font-black font-heading text-rose-600 mt-2">{analytics.lowStockCount}</div>
                      <div className="text-[11px] text-rose-500 font-bold mt-1">Items ≤ 10 stock</div>
                    </div>
                  </div>

                  {/* LOW STOCK WARNING BANNER */}
                  {analytics.lowStockProducts && analytics.lowStockProducts.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-3">
                        <span className="animate-ping w-2 h-2 rounded-full bg-rose-600"></span>
                        🚨 Automatic Inventory Alert: Low / Out of Stock Products
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {analytics.lowStockProducts.map(item => (
                          <div key={item._id} className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                              <div className="text-slate-400">{item.boutique}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-md font-black ${item.stockQuantity === 0 ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                              {item.stockQuantity === 0 ? 'Out of Stock' : `${item.stockQuantity} Left`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: PRODUCTS CATALOG */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 font-heading">Product Inventory ({productsList.length})</h3>
                    <button
                      onClick={() => setIsAddProductOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700"
                    >
                      + Add New Product
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 uppercase text-[11px] font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Stock Quantity</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productsList.map((prod) => (
                          <tr key={prod._id || prod.id} className="hover:bg-slate-50">
                            <td className="p-3 flex items-center gap-3">
                              <img src={prod.image} alt={prod.name} className="w-10 h-12 object-cover rounded-lg" />
                              <div>
                                <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                                <div className="text-[10px] text-slate-400">{prod.boutique}</div>
                              </div>
                            </td>
                            <td className="p-3 font-semibold">{prod.category} • {prod.subcategory}</td>
                            <td className="p-3 font-bold text-slate-900">₹{prod.price}</td>
                            <td className="p-3 font-bold">{prod.stockQuantity} units</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                prod.stockQuantity === 0 ? 'bg-rose-100 text-rose-700' : prod.stockQuantity <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {prod.stockQuantity === 0 ? 'Out Of Stock' : prod.stockQuantity <= 10 ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteProduct(prod._id || prod.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px]"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Orders & Delivery Tracker</h3>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 uppercase text-[11px] font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Total Amount</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ordersList.map((ord) => (
                          <tr key={ord._id || ord.orderId} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-blue-600">{ord.orderId}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{ord.customer.name}</div>
                              <div className="text-[10px] text-slate-400">{ord.customer.phone}</div>
                            </td>
                            <td className="p-3 font-black text-slate-900">₹{ord.totalAmount}</td>
                            <td className="p-3 font-semibold">{ord.paymentMethod}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                {ord.deliveryStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={ord.deliveryStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                                className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                              >
                                {['Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'].map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOMERS */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">Registered Customers ({customersList.length})</h3>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 uppercase text-[11px] font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Total Orders</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customersList.map((cust) => (
                          <tr key={cust._id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{cust.name}</td>
                            <td className="p-3 text-slate-600">{cust.email}</td>
                            <td className="p-3 font-medium">{cust.phone}</td>
                            <td className="p-3 font-bold text-blue-600">{cust.totalOrders || 0} Orders</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleToggleBlockCustomer(cust._id)}
                                className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                                  cust.isBlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {cust.isBlocked ? 'Unblock Customer' : 'Block Customer'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* MODAL: ADD PRODUCT FORM */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-lg font-bold font-heading text-slate-900">Add New Boutique Product</h4>
                <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="input-field mt-1"
                    placeholder="e.g. Designer Silk Kurti"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="input-field mt-1"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Subcategory</label>
                    <input
                      type="text"
                      required
                      value={productForm.subcategory}
                      onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                      className="input-field mt-1"
                      placeholder="Shirts / Sarees / Kurtis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Original Price</label>
                    <input
                      type="number"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Stock Qty</label>
                    <input
                      type="number"
                      required
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Image URL</label>
                  <input
                    type="url"
                    required
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
