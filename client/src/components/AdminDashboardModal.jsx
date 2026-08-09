import React, { useState, useEffect, useRef } from 'react';
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

  // Login Form State (Empty initial values for security - credentials stored only in backend .env)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Product Form Fields
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Men',
    subcategory: 'Oversized T-Shirts',
    price: '',
    originalPrice: '',
    stockQuantity: 30,
    boutique: 'QuickFit Central, Vijayawada',
    description: '',
    sizes: 'S, M, L, XL, XXL'
  });

  // 4-Angle Images State
  const [imagesData, setImagesData] = useState({
    front: '',
    back: '',
    left: '',
    right: ''
  });

  const [imageFiles, setImageFiles] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });

  const [imagePreviews, setImagePreviews] = useState({
    front: '',
    back: '',
    left: '',
    right: ''
  });

  const [fileErrors, setFileErrors] = useState({});

  // Refs for 4 file inputs
  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    left: useRef(null),
    right: useRef(null)
  };

  const angleConfig = [
    { key: 'front', label: '1. Front View (Primary Cover)', required: true, hint: 'Default card & main page image' },
    { key: 'back', label: '2. Back View (Hover View)', required: false, hint: 'Shows automatically on card hover' },
    { key: 'left', label: '3. Left Side View', required: false, hint: 'Side profile & sleeve silhouette' },
    { key: 'right', label: '4. Right Side View', required: false, hint: 'Side profile & seam details' }
  ];

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

  const handleClose = () => {
    setIsAdminOpen(false);
    if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  if (!isAdminOpen) return null;

  // Handle Admin Login Submit
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const loggedUser = await loginUser(loginEmail, loginPassword);
      if (loggedUser.role !== 'admin') {
        showToast('Access denied. Administrator privileges required.', 'error');
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

  // --- 4-ANGLE FILE SELECTION & VALIDATION ---
  const handleAngleFileChange = (angleKey, e) => {
    const file = e.target.files[0];
    setFileErrors(prev => ({ ...prev, [angleKey]: '' }));

    if (!file) return;

    // Validate format (JPG, JPEG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpg|jpeg|png|webp)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      const errMsg = 'Invalid format. Use JPG, PNG, or WEBP only.';
      setFileErrors(prev => ({ ...prev, [angleKey]: errMsg }));
      showToast(errMsg, 'error');
      return;
    }

    // Validate size (Max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errMsg = `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max allowed is 5MB.`;
      setFileErrors(prev => ({ ...prev, [angleKey]: errMsg }));
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    // Set preview
    const previewUrl = URL.createObjectURL(file);
    setImageFiles(prev => ({ ...prev, [angleKey]: file }));
    setImagePreviews(prev => ({ ...prev, [angleKey]: previewUrl }));
  };

  const handleRemoveAngleImage = (angleKey) => {
    setImageFiles(prev => ({ ...prev, [angleKey]: null }));
    setImagePreviews(prev => ({ ...prev, [angleKey]: '' }));
    setImagesData(prev => ({ ...prev, [angleKey]: '' }));
    setFileErrors(prev => ({ ...prev, [angleKey]: '' }));
    if (fileInputRefs[angleKey]?.current) {
      fileInputRefs[angleKey].current.value = '';
    }
  };

  // Swap / Reorder Angle Views
  const handleSwapAngles = (angleA, angleB) => {
    setImagesData(prev => ({
      ...prev,
      [angleA]: prev[angleB],
      [angleB]: prev[angleA]
    }));
    setImageFiles(prev => ({
      ...prev,
      [angleA]: prev[angleB],
      [angleB]: prev[angleA]
    }));
    setImagePreviews(prev => ({
      ...prev,
      [angleA]: prev[angleB],
      [angleB]: prev[angleA]
    }));
    showToast(`Swapped ${angleA.toUpperCase()} with ${angleB.toUpperCase()} view!`);
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setImagesData({ front: '', back: '', left: '', right: '' });
    setImageFiles({ front: null, back: null, left: null, right: null });
    setImagePreviews({ front: '', back: '', left: '', right: '' });
    setFileErrors({});
    setProductForm({
      name: '',
      category: 'Men',
      subcategory: 'Oversized T-Shirts',
      price: '',
      originalPrice: '',
      stockQuantity: 30,
      boutique: 'QuickFit Central, Vijayawada',
      description: 'Heavyweight 240+ GSM organic cotton tailored for clean modern streetwear drape.',
      sizes: 'S, M, L, XL, XXL'
    });
    setIsAddProductOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    const existingImages = {
      front: prod.images?.front || prod.image || '',
      back: prod.images?.back || '',
      left: prod.images?.left || '',
      right: prod.images?.right || ''
    };
    setImagesData(existingImages);
    setImageFiles({ front: null, back: null, left: null, right: null });
    setImagePreviews(existingImages);
    setFileErrors({});
    setProductForm({
      name: prod.name,
      category: 'Men',
      subcategory: prod.subcategory || 'Oversized T-Shirts',
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stockQuantity: prod.stockQuantity !== undefined ? prod.stockQuantity : 25,
      boutique: prod.boutique || 'QuickFit Central, Vijayawada',
      description: prod.description || '',
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : 'S, M, L, XL, XXL'
    });
    setIsAddProductOpen(true);
  };

  // Handle Product Create / Update Submit with Multi-Angle Uploads
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setFileErrors({});

    try {
      const finalImages = { ...imagesData };

      // Upload any newly selected files for each angle
      for (const angleKey of ['front', 'back', 'left', 'right']) {
        if (imageFiles[angleKey]) {
          const formData = new FormData();
          formData.append('image', imageFiles[angleKey]);

          const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...getAuthHeader().headers
            }
          });

          if (uploadRes.data && uploadRes.data.url) {
            finalImages[angleKey] = uploadRes.data.url;
          }
        }
      }

      // Front View is required
      if (!finalImages.front) {
        setFileErrors(prev => ({ ...prev, front: 'Front View image is required.' }));
        showToast('Please upload at least the Front View image.', 'warning');
        setIsSavingProduct(false);
        return;
      }

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
        images: finalImages,
        image: finalImages.front
      };

      let savedProductData = null;

      if (editingProduct) {
        const res = await axios.put(
          `${API_BASE_URL}/products/${editingProduct._id || editingProduct.id}`,
          payload,
          getAuthHeader()
        );
        savedProductData = res.data;
        console.log('[PRODUCT UPDATE] Confirmed update in MongoDB Atlas:', savedProductData?._id, savedProductData?.name);
        showToast(`Updated "${payload.name}" in database! ✨`);
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/products`,
          payload,
          getAuthHeader()
        );
        savedProductData = res.data;
        console.log('[PRODUCT CREATE] Confirmed insertion into MongoDB Atlas:', savedProductData?._id, savedProductData?.name);
        showToast(`Created product "${payload.name}" permanently in MongoDB! 🛍️`);
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);

      // Immediately synchronize global catalog and admin state from MongoDB Atlas
      await fetchProducts();
      await loadAdminData();
    } catch (err) {
      console.error('[PRODUCT SAVE ERROR] Failed to save product:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save product', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from MongoDB Atlas?`)) return;

    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, getAuthHeader());
      console.log('[PRODUCT DELETE] Successfully removed from MongoDB Atlas:', id, name);
      showToast(`Deleted "${name}" from database.`);
      await fetchProducts();
      await loadAdminData();
    } catch (err) {
      console.error('[PRODUCT DELETE ERROR] Failed to delete product:', err);
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[94vh]">
        
        {/* TOP HEADER */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xl shadow-xs border border-slate-700">
              ⚡
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight flex items-center gap-2">
                QuickFit Admin Portal
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                4-Angle Product Gallery, Multi-Image Upload & Order Management
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
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
              title="Close Admin Panel"
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
                RESTRICTED PORTAL
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-heading">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-500">
                Enter your administrative credentials to manage products, catalog inventory, and orders.
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
                  placeholder="admin@quickfitmenswear.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-600 uppercase">Total Revenue</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        ₹{analytics.totalRevenue || ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0)}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-600 uppercase">Total Orders</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        {analytics.totalOrders || ordersList.length}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-600 uppercase">Live Products</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                        {productsList.length}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200">
                      <div className="text-xs font-bold text-amber-700 uppercase">Low Stock Warnings</div>
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
                        Manage products with 4 separate image views: Front, Back, Left, and Right angles.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAdd}
                      className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 !min-h-[40px]"
                    >
                      <span>📷 + Add Product (4 Image Views)</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                          <th className="p-3">Front View</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Subcategory</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">4-Angle Status</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productsList.map((prod) => {
                          const angleCount = prod.images
                            ? [prod.images.front, prod.images.back, prod.images.left, prod.images.right].filter(Boolean).length
                            : (prod.gallery ? prod.gallery.length : 1);

                          return (
                            <tr key={prod._id || prod.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <img
                                  src={prod.images?.front || prod.image}
                                  alt={prod.name}
                                  className="w-12 h-16 object-cover rounded-lg border border-slate-200 bg-slate-100 shadow-xs"
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
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-max ${
                                  angleCount === 4
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : angleCount >= 2
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <span>📷</span>
                                  <span>{angleCount} / 4 Views</span>
                                </span>
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
                                  Edit Angles
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod._id || prod.id, prod.name)}
                                  className="font-bold text-rose-600 hover:underline uppercase text-[10px]"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

      {/* ADD / EDIT PRODUCT MODAL WITH 4-ANGLE DIRECT IMAGE UPLOADS */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading flex items-center gap-2">
                <span>📷</span>
                <span>{editingProduct ? 'Edit Men\'s Product & Angles' : 'Add New Men\'s Product (4 Angles)'}</span>
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* 1. 4-ANGLE SEPARATE IMAGE UPLOAD FIELDS */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <span>🖼️</span>
                    <span>Product Image Gallery (4 Angles)</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    JPG, PNG, WEBP • Max 5MB Each
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {angleConfig.map((angle) => {
                    const preview = imagePreviews[angle.key] || imagesData[angle.key];
                    const error = fileErrors[angle.key];

                    return (
                      <div
                        key={angle.key}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
                      >
                        {/* ANGLE LABEL */}
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-[11px]">
                            {angle.label} {angle.required && <strong className="text-rose-500">*</strong>}
                          </span>
                          {preview && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                              ✓ Loaded
                            </span>
                          )}
                        </div>

                        {/* HIDDEN FILE INPUT */}
                        <input
                          type="file"
                          ref={fileInputRefs[angle.key]}
                          onChange={(e) => handleAngleFileChange(angle.key, e)}
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        {/* PREVIEW OR UPLOAD TRIGGER */}
                        {preview ? (
                          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                            <img
                              src={preview}
                              alt={angle.label}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* OVERLAY ACTION CONTROLS */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <button
                                type="button"
                                onClick={() => fileInputRefs[angle.key]?.current?.click()}
                                className="px-2.5 py-1 rounded bg-white text-slate-900 font-bold text-[10px] hover:bg-slate-100 shadow-sm"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAngleImage(angle.key)}
                                className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 shadow-sm"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs[angle.key]?.current?.click()}
                            className="aspect-[3/4] border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-100/50 transition-colors space-y-1"
                          >
                            <span className="text-xl">📁</span>
                            <span className="font-bold text-slate-800 text-[11px] leading-tight">
                              Upload {angle.key.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-slate-400 leading-tight">
                              Click to select from PC
                            </span>
                          </div>
                        )}

                        {/* ERROR IF ANY */}
                        {error && (
                          <div className="text-rose-600 font-bold text-[10px]">
                            ⚠️ {error}
                          </div>
                        )}

                        {/* SWAP CONTROLS */}
                        {preview && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-500">
                            <span>Swap with:</span>
                            <div className="flex gap-1">
                              {angle.key !== 'front' && (
                                <button
                                  type="button"
                                  onClick={() => handleSwapAngles(angle.key, 'front')}
                                  className="underline hover:text-slate-900 font-semibold"
                                >
                                  Front
                                </button>
                              )}
                              {angle.key !== 'back' && (
                                <button
                                  type="button"
                                  onClick={() => handleSwapAngles(angle.key, 'back')}
                                  className="underline hover:text-slate-900 font-semibold"
                                >
                                  Back
                                </button>
                              )}
                              {angle.key !== 'left' && angle.key !== 'right' && (
                                <button
                                  type="button"
                                  onClick={() => handleSwapAngles(angle.key, 'left')}
                                  className="underline hover:text-slate-900 font-semibold"
                                >
                                  Side
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. PRODUCT NAME */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Heavy French Terry Oversized Tee"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* 3. SUBCATEGORY & STOCK */}
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

              {/* 4. PRICE & ORIGINAL PRICE */}
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

              {/* 5. SIZES */}
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

              {/* 6. DESCRIPTION */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Details about 240+ GSM French Terry fabric, relaxed streetwear drape..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900"
                ></textarea>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSavingProduct}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition-all mt-2 flex items-center justify-center gap-2 !min-h-[44px]"
              >
                {isSavingProduct ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Uploading 4 Angles & Saving Product...</span>
                  </>
                ) : (
                  <span>{editingProduct ? 'Save Changes ➔' : 'Upload Images & Add Product ➔'}</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
