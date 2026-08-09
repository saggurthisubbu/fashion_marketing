import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';

export const AdminDashboardModal = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    API_BASE_URL,
    showToast,
    user,
    loginUser,
    logoutUser,
    fetchProducts
  } = useShop();

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, customers
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('quickfit_token') || '');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('saggurthisubbu9@gmail.com');
  const [loginPassword, setLoginPassword] = useState('QuickFitAdmin@2026!');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Analytics Data
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    lowStockCount: 0,
    lowStockProducts: []
  });

  // Data Collections
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Add/Edit Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Men',
    subcategory: 'Oversized T-Shirts',
    price: '',
    originalPrice: '',
    stockQuantity: 30,
    boutique: 'QuickFit Central, Vijayawada',
    description: '',
    sizes: 'S, M, L, XL, XXL',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
  });

  const getAuthHeader = () => {
    const token = user?.token || adminToken || localStorage.getItem('quickfit_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Fetch Dashboard Analytics
  const loadAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/analytics`, getAuthHeader());
      if (res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn('Could not load admin analytics:', err.message);
    }
  };

  // Fetch All Admin Data
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [prodRes, orderRes, custRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/orders`, getAuthHeader()).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/admin/customers`, getAuthHeader()).catch(() => ({ data: [] }))
      ]);
      setProductsList(prodRes.data || []);
      setOrdersList(orderRes.data || []);
      setCustomersList(custRes.data || []);
      await loadAnalytics();
    } catch (err) {
      console.warn('Error loading admin data:', err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminOpen) {
      loadAdminData();
    }
  }, [isAdminOpen]);

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
      showToast('Admin Dashboard Authenticated 🔓');
      loadAdminData();
    } catch (err) {
      // Handled in shop context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Men',
      subcategory: 'Oversized T-Shirts',
      price: '',
      originalPrice: '',
      stockQuantity: 30,
      boutique: 'QuickFit Central, Vijayawada',
      description: 'Heavyweight organic cotton tailored for modern drape.',
      sizes: 'S, M, L, XL, XXL',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
    });
    setIsAddProductOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: 'Men',
      subcategory: prod.subcategory || 'Oversized T-Shirts',
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stockQuantity: prod.stockQuantity !== undefined ? prod.stockQuantity : 25,
      boutique: prod.boutique || 'QuickFit Central, Vijayawada',
      description: prod.description || '',
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : 'S, M, L, XL, XXL',
      image: prod.image || ''
    });
    setIsAddProductOpen(true);
  };

  // Handle Product Create / Update Submit
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name.trim(),
        category: 'Men',
        subcategory: productForm.subcategory || 'Oversized T-Shirts',
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stockQuantity: Number(productForm.stockQuantity || 25),
        boutique: productForm.boutique || 'QuickFit Central, Vijayawada',
        description: productForm.description || 'Premium heavyweight streetwear.',
        sizes: typeof productForm.sizes === 'string'
          ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
          : productForm.sizes,
        image: productForm.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
      };

      if (editingProduct) {
        await axios.put(
          `${API_BASE_URL}/products/${editingProduct._id || editingProduct.id}`,
          payload,
          getAuthHeader()
        );
        showToast(`Updated "${payload.name}" successfully! ✨`);
      } else {
        await axios.post(
          `${API_BASE_URL}/products`,
          payload,
          getAuthHeader()
        );
        showToast(`Created new product "${payload.name}"! 🛍️`);
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);
      await fetchProducts();
      await loadAdminData();
    } catch (err) {
      console.error('Save product error:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save product', 'error');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, getAuthHeader());
      showToast(`Deleted "${name}"`, 'info');
      await fetchProducts();
      await loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product.', 'error');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus }, getAuthHeader());
      showToast(`Order status updated to "${newStatus}" 🚚`);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const isAdminAuthenticated = Boolean(user && user.role === 'admin') || Boolean(adminToken);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        
        {/* TOP HEADER */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight flex items-center gap-2">
                QuickFit Admin Portal
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Men's Fashion Catalog & Order Management • Vijayawada Central
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <button
                onClick={logoutUser}
                className="text-xs font-bold text-slate-400 hover:text-white underline"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ADMIN AUTH CHECK */}
        {!isAdminAuthenticated ? (
          <div className="p-6 sm:p-12 max-w-md mx-auto w-full my-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                RESTRICTED ACCESS
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-heading">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-500">
                Enter your administrative credentials to manage products, stock, and customer orders.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition-all mt-2"
              >
                {isAuthLoading ? 'Authenticating...' : 'Unlock Dashboard ➔'}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD BODY */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label: '📊 Overview' },
                { id: 'products', label: `🛍️ Products (${productsList.length})` },
                { id: 'orders', label: `📦 Orders (${ordersList.length})` },
                { id: 'customers', label: `👥 Customers (${customersList.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-bold px-4 py-3 rounded-t-xl transition-colors whitespace-nowrap !min-h-[40px] ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 border-t-2 border-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TAB 1: OVERVIEW METRICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="text-xs font-bold text-blue-600 uppercase">Total Revenue</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        ₹{analytics.totalRevenue || ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0)}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <div className="text-xs font-bold text-emerald-600 uppercase">Total Orders</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        {analytics.totalOrders || ordersList.length}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 border border-purple-100">
                      <div className="text-xs font-bold text-purple-600 uppercase">Live Products</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        {productsList.length}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-100">
                      <div className="text-xs font-bold text-amber-600 uppercase">Low Stock Warnings</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        {analytics.lowStockCount || productsList.filter(p => p.stockQuantity <= 5).length}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS INVENTORY */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 font-heading">
                        Men's Fashion Catalog
                      </h3>
                      <p className="text-xs text-slate-500">
                        Live products in database. Adding a product immediately updates the live website.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAdd}
                      className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 !min-h-[40px]"
                    >
                      <span>+ Add New Product</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                          <th className="p-3">Image</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Subcategory</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productsList.map((prod) => (
                          <tr key={prod._id || prod.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-12 h-16 object-cover rounded-lg border border-slate-200 bg-slate-100"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate">
                              {prod.name}
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px]">
                                {prod.subcategory || 'Oversized T-Shirts'}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-900">
                              ₹{prod.price}
                            </td>
                            <td className="p-3">
                              {prod.stockQuantity <= 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-black text-[10px]">
                                  0 (Out)
                                </span>
                              ) : prod.stockQuantity <= 5 ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  {prod.stockQuantity} (Low)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {prod.stockQuantity} in Stock
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="font-bold text-blue-600 hover:underline uppercase text-[10px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod._id || prod.id, prod.name)}
                                className="font-bold text-rose-600 hover:underline uppercase text-[10px]"
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

              {/* TAB 3: ORDERS LOG */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-heading">
                      Customer Orders
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time orders placed across Vijayawada.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ordersList.map((ord) => (
                          <tr key={ord._id || ord.orderId} className="hover:bg-slate-50">
                            <td className="p-3 font-black text-slate-900">{ord.orderId}</td>
                            <td className="p-3 font-bold text-slate-800">{ord.customer_name || ord.customer?.name}</td>
                            <td className="p-3 text-slate-600">{ord.customer_phone || ord.customer?.phone}</td>
                            <td className="p-3 max-w-[200px]">
                              {ord.items?.map((it, i) => (
                                <div key={i} className="text-[11px] text-slate-600 truncate">
                                  • {it.name} ({it.size || 'M'}) x{it.qty || it.quantity || 1}
                                </div>
                              ))}
                            </td>
                            <td className="p-3 font-black text-slate-900">₹{ord.total_amount || ord.totalAmount}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord._id || ord.id, e.target.value)}
                                className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-bold cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
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
                  <h3 className="text-lg font-black text-slate-900 font-heading">
                    Registered Customers
                  </h3>
                  <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customersList.map((cust) => (
                          <tr key={cust._id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{cust.name}</td>
                            <td className="p-3 text-slate-600">{cust.email}</td>
                            <td className="p-3 text-slate-600">{cust.phone || 'N/A'}</td>
                            <td className="p-3 font-bold text-slate-900">{cust.totalOrders || 0}</td>
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

      </div>

      {/* ADD / EDIT PRODUCT SUB-MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                {editingProduct ? 'Edit Men\'s Product' : 'Add New Men\'s Product'}
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Heavy French Terry Oversized Tee"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subcategory *</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="Oversized T-Shirts">Oversized T-Shirts</option>
                    <option value="Drop Shoulder T-Shirts">Drop Shoulder T-Shirts</option>
                    <option value="Polo T-Shirts">Polo T-Shirts</option>
                    <option value="Shirts">Shirts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="1499"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="2499"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                />
              </div>

              {productForm.image && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={productForm.image}
                    alt="Preview"
                    className="w-12 h-14 object-cover rounded-lg bg-slate-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="text-[11px] text-slate-500 truncate">
                    Image Preview Ready
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Available Sizes (comma separated)</label>
                <input
                  type="text"
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                  placeholder="S, M, L, XL, XXL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Details about 240 GSM French Terry fabric, relaxed drape..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition-all mt-2"
              >
                {editingProduct ? 'Save Changes ➔' : 'Add to Catalog ➔'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
