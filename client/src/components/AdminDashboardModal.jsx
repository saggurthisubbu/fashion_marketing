import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboardTab } from './admin/tabs/AdminDashboardTab';
import { AdminOrdersTab } from './admin/tabs/AdminOrdersTab';
import { AdminProductsTab } from './admin/tabs/AdminProductsTab';
import { AdminCategoriesTab } from './admin/tabs/AdminCategoriesTab';
import { AdminCustomersTab } from './admin/tabs/AdminCustomersTab';
import { AdminDeliveryTab } from './admin/tabs/AdminDeliveryTab';
import { AdminInventoryTab } from './admin/tabs/AdminInventoryTab';
import { AdminPaymentsTab } from './admin/tabs/AdminPaymentsTab';
import { AdminAnalyticsTab } from './admin/tabs/AdminAnalyticsTab';
import { AdminNotificationsTab } from './admin/tabs/AdminNotificationsTab';
import { AdminSettingsTab } from './admin/tabs/AdminSettingsTab';
import { AdminStoresTab } from './admin/tabs/AdminStoresTab';
import { AdminStoreOwnersTab } from './admin/tabs/AdminStoreOwnersTab';
import { Camera, X, Upload } from 'lucide-react';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const AdminDashboardModal = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    API_BASE_URL,
    showToast,
    user,
    setUser,
    token,
    setToken,
    fetchProducts,
    products = []
  } = useShop();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('quickfit_token') || '');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Collections Data
  const [analytics, setAnalytics] = useState({});
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentsData, setPaymentsData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [settings, setSettings] = useState({});
  const [storesList, setStoresList] = useState([]);
  const [storeOwnersList, setStoreOwnersList] = useState([]);
  const [storeAnalytics, setStoreAnalytics] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    storeId: '',
    storeName: '',
    category: 'Men',
    subcategory: 'Oversized T-Shirts',
    price: '',
    originalPrice: '',
    stockQuantity: 30,
    boutique: 'QuickFit Central, Vijayawada',
    description: 'Heavyweight 240+ GSM organic cotton tailored for clean modern streetwear drape.',
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

  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    left: useRef(null),
    right: useRef(null)
  };

  const angleConfig = [
    { key: 'front', label: '1. Front View (Primary Cover)', required: true },
    { key: 'back', label: '2. Back View (Card Hover)', required: false },
    { key: 'left', label: '3. Left Profile View', required: false },
    { key: 'right', label: '4. Right Profile View', required: false }
  ];

  const getAuthHeader = () => {
    const currentToken = user?.token || adminToken || localStorage.getItem('quickfit_token');
    return {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    };
  };

  // Load All Admin Data
  const loadAllAdminData = async () => {
    setIsLoadingData(true);
    try {
      const auth = getAuthHeader();
      const currentUser = user || JSON.parse(localStorage.getItem('quickfit_user') || '{}');
      const isAdmin = currentUser?.role === 'admin';
      const isStoreOwnerRole = currentUser?.role === 'store_owner';

      const baseRequests = [
        axios.get(`${API_BASE_URL}/admin/analytics`, auth).catch(() => ({ data: {} })),
        axios.get(`${API_BASE_URL}/products`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/orders`, auth).catch(() => ({ data: [] })),
        isAdmin ? axios.get(`${API_BASE_URL}/admin/customers`, auth).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        isAdmin ? axios.get(`${API_BASE_URL}/admin/delivery-partners`, auth).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        axios.get(`${API_BASE_URL}/admin/categories`, auth).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/admin/notifications`, auth).catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
        isAdmin ? axios.get(`${API_BASE_URL}/admin/settings`, auth).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
        axios.get(`${API_BASE_URL}/admin/stores`, auth).catch(() => ({ data: [] }))
      ];

      const [
        analyticsRes,
        prodRes,
        orderRes,
        custRes,
        deliveryRes,
        catRes,
        notifRes,
        settingsRes,
        storesRes
      ] = await Promise.all(baseRequests);

      setAnalytics(analyticsRes.data || {});
      const loadedProducts = Array.isArray(prodRes.data) && prodRes.data.length > 0
        ? prodRes.data
        : (Array.isArray(products) && products.length > 0 ? products : []);
      setProductsList(loadedProducts);
      setOrdersList(orderRes.data || []);
      setCustomersList(custRes.data || []);
      setDeliveryPartners(deliveryRes.data || []);
      setCategories(catRes.data || []);
      setNotifications(notifRes.data?.notifications || []);
      setUnreadNotifsCount(notifRes.data?.unreadCount || 0);
      setSettings(settingsRes.data || {});
      setStoresList(Array.isArray(storesRes.data) ? storesRes.data : []);

      // Load Super Admin-only data
      if (isAdmin) {
        const [ownersRes, storeAnalyticsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/store-owners`, auth).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/admin/store-analytics`, auth).catch(() => ({ data: {} }))
        ]);
        setStoreOwnersList(Array.isArray(ownersRes.data) ? ownersRes.data : []);
        setStoreAnalytics(storeAnalyticsRes.data || {});
      }
    } catch (err) {
      console.warn('Error loading admin portal data:', err.message);
      if (Array.isArray(products) && products.length > 0) {
        setProductsList(products);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminOpen) {
      loadAllAdminData();
    }
  }, [isAdminOpen]);

  if (!isAdminOpen) return null;

  // Authentication Handlers
  const handleAdminLogin = async (identifier, password) => {
    setIsAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier,
        password
      });

      if (res.data.role !== 'admin' && res.data.role !== 'store_owner') {
        showToast('Access denied: Unauthorized role.', 'error');
        throw new Error('Not authorized as admin or store owner.');
      }

      if (typeof setUser === 'function') setUser(res.data);
      if (typeof setToken === 'function') setToken(res.data.token);
      setAdminToken(res.data.token);
      localStorage.setItem('quickfit_user', JSON.stringify(res.data));
      localStorage.setItem('quickfit_token', res.data.token);
      showToast(res.data.role === 'store_owner' ? `Authenticated! Welcome Store Manager ${res.data.name} 🔓` : `Admin Authenticated! Welcome ${res.data.name} 🔓`);
      await loadAllAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      showToast(msg, 'error');
      throw new Error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    if (typeof setUser === 'function') setUser(null);
    if (typeof setToken === 'function') setToken('');
    setAdminToken('');
    localStorage.removeItem('quickfit_user');
    localStorage.removeItem('quickfit_token');
    showToast('Admin session terminated.', 'info');
    setIsAdminOpen(false);
    if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  const isAdminAuthenticated = Boolean((user && user.role === 'admin') || adminToken);

  // --- 4-Angle File Handlers ---
  const handleAngleFileChange = (angleKey, e) => {
    const file = e.target.files && e.target.files[0];
    setFileErrors(prev => ({ ...prev, [angleKey]: '' }));
    if (!file) return;

    console.log(`[IMAGE UPLOAD] Angle: ${angleKey}`, "Selected File:", file);

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpg|jpeg|png|webp)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      const errMsg = 'Invalid format. Use JPG, PNG, or WEBP only.';
      setFileErrors(prev => ({ ...prev, [angleKey]: errMsg }));
      showToast(errMsg, 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const errMsg = 'File size exceeds 5MB limit.';
      setFileErrors(prev => ({ ...prev, [angleKey]: errMsg }));
      showToast(errMsg, 'error');
      return;
    }

    // Generate instant preview via FileReader & object URL
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target.result;
        console.log(`[IMAGE PREVIEW] Angle: ${angleKey}`, "Preview URL:", previewUrl ? `${previewUrl.substring(0, 50)}...` : '');
        setImageFiles(prev => ({ ...prev, [angleKey]: file }));
        setImagePreviews(prev => ({ ...prev, [angleKey]: previewUrl }));
        setImagesData(prev => ({ ...prev, [angleKey]: previewUrl }));
      };
      reader.onerror = () => {
        const objUrl = URL.createObjectURL(file);
        console.log(`[IMAGE PREVIEW FALLBACK] Angle: ${angleKey}`, "Preview URL:", objUrl);
        setImageFiles(prev => ({ ...prev, [angleKey]: file }));
        setImagePreviews(prev => ({ ...prev, [angleKey]: objUrl }));
        setImagesData(prev => ({ ...prev, [angleKey]: objUrl }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      const objUrl = URL.createObjectURL(file);
      console.log(`[IMAGE PREVIEW OBJECT URL] Angle: ${angleKey}`, "Preview URL:", objUrl);
      setImageFiles(prev => ({ ...prev, [angleKey]: file }));
      setImagePreviews(prev => ({ ...prev, [angleKey]: objUrl }));
      setImagesData(prev => ({ ...prev, [angleKey]: objUrl }));
    }
  };

  const handleRemoveAngle = (angleKey) => {
    setImageFiles(prev => ({ ...prev, [angleKey]: null }));
    setImagePreviews(prev => ({ ...prev, [angleKey]: '' }));
    setImagesData(prev => ({ ...prev, [angleKey]: '' }));
    setFileErrors(prev => ({ ...prev, [angleKey]: '' }));
    if (fileInputRefs[angleKey]?.current) fileInputRefs[angleKey].current.value = '';
  };

  const handleSwapAngles = (angleA, angleB) => {
    setImagesData(prev => ({ ...prev, [angleA]: prev[angleB], [angleB]: prev[angleA] }));
    setImageFiles(prev => ({ ...prev, [angleA]: prev[angleB], [angleB]: prev[angleA] }));
    setImagePreviews(prev => ({ ...prev, [angleA]: prev[angleB], [angleB]: prev[angleA] }));
    showToast(`Swapped ${angleA.toUpperCase()} view with ${angleB.toUpperCase()}!`);
  };

  const isStoreOwner = user?.role === 'store_owner';
  const storeOwnerId = user?.assignedStoreId;

  // Open Add / Edit Product Modals
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setImagesData({ front: '', back: '', left: '', right: '' });
    setImageFiles({ front: null, back: null, left: null, right: null });
    setImagePreviews({ front: '', back: '', left: '', right: '' });
    setFileErrors({});

    const defaultStoreId = isStoreOwner && storeOwnerId
      ? storeOwnerId
      : (storesList.length > 0 ? storesList[0]._id : '');
    const defaultStore = storesList.find(s => s._id === defaultStoreId);
    const defaultStoreName = defaultStore ? defaultStore.name : '';

    setProductForm({
      name: '',
      storeId: defaultStoreId,
      storeName: defaultStoreName,
      category: 'Men',
      subcategory: 'Oversized T-Shirts',
      price: '',
      originalPrice: '',
      stockQuantity: 30,
      boutique: defaultStoreName || 'QuickFit Central, Vijayawada',
      description: 'Heavyweight 240+ GSM organic cotton tailored for clean modern streetwear drape.',
      sizes: 'S, M, L, XL, XXL'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    const existing = {
      front: prod.images?.front || prod.image || '',
      back: prod.images?.back || '',
      left: prod.images?.left || '',
      right: prod.images?.right || ''
    };
    setImagesData(existing);
    setImageFiles({ front: null, back: null, left: null, right: null });
    setImagePreviews(existing);
    setFileErrors({});
    setProductForm({
      name: prod.name,
      storeId: prod.storeId || (storesList.length > 0 ? storesList[0]._id : ''),
      storeName: prod.storeName || (storesList.length > 0 ? storesList[0].name : ''),
      category: 'Men',
      subcategory: prod.subcategory || 'Oversized T-Shirts',
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stockQuantity: prod.stockQuantity !== undefined ? prod.stockQuantity : 25,
      boutique: prod.boutique || 'QuickFit Central, Vijayawada',
      description: prod.description || '',
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : 'S, M, L, XL, XXL'
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setFileErrors({});

    try {
      const finalImages = { ...imagesData };

      // Upload newly selected files
      for (const angleKey of ['front', 'back', 'left', 'right']) {
        if (imageFiles[angleKey]) {
          console.log(`[IMAGE UPLOAD START] Uploading ${angleKey} file:`, imageFiles[angleKey].name);
          const formData = new FormData();
          formData.append('image', imageFiles[angleKey]);

          const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...getAuthHeader().headers
            }
          });

          const uploadedUrl = uploadRes.data?.imageUrl || uploadRes.data?.url || uploadRes.data?.path;
          console.log(`[IMAGE UPLOAD COMPLETE] Angle: ${angleKey}`, "Uploaded URL:", uploadedUrl);

          if (uploadedUrl) {
            finalImages[angleKey] = uploadedUrl;
          }
        }
      }

      if (!finalImages.front) {
        finalImages.front = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';
      }

      const payload = {
        name: productForm.name.trim(),
        storeId: productForm.storeId,
        storeName: productForm.storeName,
        category: 'Men',
        subcategory: productForm.subcategory || 'Oversized T-Shirts',
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stockQuantity: Number(productForm.stockQuantity || 25),
        boutique: productForm.boutique || 'QuickFit Central, Vijayawada',
        description: productForm.description || '',
        sizes: typeof productForm.sizes === 'string'
          ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
          : productForm.sizes,
        images: finalImages,
        image: finalImages.front
      };

      let savedProd = null;
      if (editingProduct) {
        const res = await axios.put(`${API_BASE_URL}/products/${editingProduct._id || editingProduct.id}`, payload, getAuthHeader());
        savedProd = res.data;
        showToast(`Updated "${payload.name}" in database! ✨`);
      } else {
        const res = await axios.post(`${API_BASE_URL}/products`, payload, getAuthHeader());
        savedProd = res.data;
        showToast(`Created product "${payload.name}" permanently in MongoDB! 🛍️`);
      }

      if (savedProd) {
        setProductsList(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(p => (p._id || p.id) === (savedProd._id || savedProd.id));
          if (exists) {
            return list.map(p => (p._id || p.id) === (savedProd._id || savedProd.id) ? savedProd : p);
          }
          return [savedProd, ...list];
        });
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to save product', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" permanently?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, getAuthHeader());
      showToast(`Deleted "${name}".`);
      setProductsList(prev => (Array.isArray(prev) ? prev.filter(p => (p._id || p.id) !== id) : []));
      await fetchProducts();
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  const handleToggleProductStock = async (id, inStock) => {
    try {
      await axios.put(`${API_BASE_URL}/products/${id}`, { inStock }, getAuthHeader());
      showToast(`Product status updated.`);
      setProductsList(prev => (Array.isArray(prev) ? prev.map(p => (p._id || p.id) === id ? { ...p, inStock } : p) : []));
      await fetchProducts();
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status }, getAuthHeader());
      showToast(`Order status updated to "${status}" 🚚`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleAssignDeliveryPartner = async (orderId, partnerData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/orders/${orderId}/assign-partner`, partnerData, getAuthHeader());
      showToast(`Order assigned to ${partnerData.partnerName}! 🚴`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to assign partner', 'error');
    }
  };

  // Customer Handlers
  const handleToggleBlockCustomer = async (id) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/admin/customers/${id}/block`, {}, getAuthHeader());
      showToast(res.data.message);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update customer status', 'error');
    }
  };

  const handleViewCustomerOrders = async (id) => {
    const res = await axios.get(`${API_BASE_URL}/admin/customers/${id}/orders`, getAuthHeader());
    return res.data;
  };

  // Delivery Partner Handlers
  const handleAddPartner = async (partnerData) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/delivery-partners`, partnerData, getAuthHeader());
      showToast(`Added delivery rider "${partnerData.name}"!`);
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add rider', 'error');
    }
  };

  const handleEditPartner = async (id, partnerData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/delivery-partners/${id}`, partnerData, getAuthHeader());
      showToast(`Updated rider details.`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update partner', 'error');
    }
  };

  const handleDeletePartner = async (id, name) => {
    if (!window.confirm(`Delete delivery rider "${name}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/delivery-partners/${id}`, getAuthHeader());
      showToast(`Deleted rider.`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to delete partner', 'error');
    }
  };

  // Inventory Handlers
  const handleUpdateStock = async (id, payload) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/inventory/${id}/stock`, payload, getAuthHeader());
      showToast(`Stock updated!`);
      await fetchProducts();
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update stock', 'error');
    }
  };

  // Category Handlers
  const handleAddCategory = async (catData) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/categories`, catData, getAuthHeader());
      showToast(`Created category "${catData.name}"!`);
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create category', 'error');
    }
  };

  const handleEditCategory = async (id, catData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/categories/${id}`, catData, getAuthHeader());
      showToast(`Updated category.`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/categories/${id}`, getAuthHeader());
      showToast(`Deleted category.`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Payment Handlers
  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/payments/${id}/status`, { paymentStatus: status }, getAuthHeader());
      showToast(`Payment status updated to "${status}".`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to update payment status', 'error');
    }
  };

  // Notification Handlers
  const handleMarkNotificationRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/notifications/${id}/read`, {}, getAuthHeader());
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/admin/notifications/read-all`, {}, getAuthHeader());
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifsCount(0);
      showToast('All notifications marked as read.');
    } catch (err) {}
  };

  // Settings Handlers
  const handleSaveSettings = async (settingsData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/settings`, settingsData, getAuthHeader());
      showToast('Settings saved!');
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    await axios.put(`${API_BASE_URL}/admin/change-password`, { currentPassword, newPassword }, getAuthHeader());
    showToast('Admin password updated successfully!');
  };

  // Store Handlers
  const handleAddStore = async (storeData) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/stores`, storeData, getAuthHeader());
      showToast(`Store "${storeData.name}" created! 🏪`);
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create store', 'error');
      throw err;
    }
  };

  const handleEditStore = async (id, storeData) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/stores/${id}`, storeData, getAuthHeader());
      showToast(`Store "${storeData.name}" updated!`);
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update store', 'error');
      throw err;
    }
  };

  const handleDeleteStore = async (id, name) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/stores/${id}`, getAuthHeader());
      showToast(`Store "${name}" deleted.`);
      await loadAllAdminData();
    } catch (err) {
      showToast('Failed to delete store', 'error');
    }
  };

  let currentProducts = (Array.isArray(productsList) && productsList.length > 0)
    ? productsList
    : (Array.isArray(products) ? products : []);

  if (isStoreOwner && storeOwnerId) {
    currentProducts = currentProducts.filter(p => p.storeId?.toString() === storeOwnerId.toString());
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      
      {!isAdminAuthenticated ? (
        <AdminLogin onLogin={handleAdminLogin} isLoading={isAuthLoading} />
      ) : (
        <AdminLayout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleAdminLogout}
          onClose={() => setIsAdminOpen(false)}
          onOpenAddProduct={handleOpenAddProduct}
          adminUser={user || { name: 'Admin', email: 'admin@quickfit.com' }}
          counts={{
            orders: ordersList.length,
            products: currentProducts.length,
            categories: categories.length,
            customers: customersList.length,
            delivery: deliveryPartners.length,
            stores: storesList.length,
            storeOwners: storeOwnersList.length,
            lowStock: analytics.lowStockCount || currentProducts.filter(p => p.stockQuantity <= 10).length
          }}
          notifications={notifications}
          unreadNotifsCount={unreadNotifsCount}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
        >
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              analytics={analytics}
              ordersList={ordersList}
              productsList={currentProducts}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              adminUser={user}
              storeAnalytics={storeAnalytics}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              ordersList={ordersList}
              deliveryPartners={deliveryPartners}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAssignDeliveryPartner={handleAssignDeliveryPartner}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab
              productsList={currentProducts}
              categories={categories}
              storesList={storesList}
              onOpenAddProduct={handleOpenAddProduct}
              onOpenEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductStock={handleToggleProductStock}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              apiBaseUrl={API_BASE_URL}
              getAuthHeader={getAuthHeader}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersTab
              customersList={customersList}
              onToggleBlockCustomer={handleToggleBlockCustomer}
              onViewCustomerOrders={handleViewCustomerOrders}
            />
          )}

          {activeTab === 'delivery' && (
            <AdminDeliveryTab
              deliveryPartners={deliveryPartners}
              onAddPartner={handleAddPartner}
              onEditPartner={handleEditPartner}
              onDeletePartner={handleDeletePartner}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryTab
              inventoryData={analytics}
              productsList={currentProducts}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activeTab === 'payments' && (
            <AdminPaymentsTab
              paymentsData={paymentsData}
              ordersList={ordersList}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsTab
              analytics={analytics}
              ordersList={ordersList}
              productsList={currentProducts}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsTab
              notifications={notifications}
              unreadCount={unreadNotifsCount}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onChangePassword={handleChangePassword}
            />
          )}

          {activeTab === 'stores' && (
            <AdminStoresTab
              storesList={storesList}
              onAddStore={handleAddStore}
              onEditStore={handleEditStore}
              onDeleteStore={handleDeleteStore}
            />
          )}

          {activeTab === 'store-owners' && (
            <AdminStoreOwnersTab
              storeOwnersList={storeOwnersList}
              storesList={storesList}
              onRefresh={loadAllAdminData}
              API_BASE_URL={API_BASE_URL}
              token={user?.token || adminToken || localStorage.getItem('quickfit_token')}
              showToast={showToast}
            />
          )}
        </AdminLayout>
      )}

      {/* 4-ANGLE PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl animate-in zoom-in-95 text-zinc-100">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base sm:text-lg font-black font-heading text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-zinc-400" />
                <span>{editingProduct ? 'Edit Product & 4-Angle Images' : 'Add Men\'s Apparel (4 Image Views)'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* 4-Angle Upload Grid */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-zinc-400" />
                    <span>Multi-Angle Product Gallery</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
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
                        className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">
                            {angle.label} {angle.required && <strong className="text-red-400">*</strong>}
                          </span>
                          {preview && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                              ✓ Loaded
                            </span>
                          )}
                        </div>

                        <input
                          type="file"
                          ref={fileInputRefs[angle.key]}
                          onChange={(e) => handleAngleFileChange(angle.key, e)}
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        {preview ? (
                          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                            <img
                              src={resolveImageUrl(preview)}
                              alt={angle.label}
                              loading="eager"
                              onError={(e) => {
                                console.warn(`[IMAGE PREVIEW ERROR] Failed to load preview for ${angle.label}`);
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <button
                                type="button"
                                onClick={() => fileInputRefs[angle.key]?.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-white text-zinc-950 font-bold text-[10px] hover:bg-zinc-200 cursor-pointer shadow-md"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAngle(angle.key)}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[10px] hover:bg-red-700 cursor-pointer shadow-md"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs[angle.key]?.current?.click()}
                            className="aspect-[3/4] border-2 border-dashed border-zinc-700 hover:border-white rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors space-y-1.5"
                          >
                            <Upload className="w-5 h-5 text-zinc-400" />
                            <span className="font-bold text-white text-[11px]">
                              Select {angle.key.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              Click to choose image file
                            </span>
                          </div>
                        )}

                        {error && (
                          <div className="text-red-400 font-bold text-[10px]">
                            ⚠️ {error}
                          </div>
                        )}

                        {preview && (
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[9px] text-zinc-400">
                            <span>Swap angle:</span>
                            <div className="flex gap-1.5 font-bold">
                              {angle.key !== 'front' && (
                                <button type="button" onClick={() => handleSwapAngles(angle.key, 'front')} className="hover:text-white underline">Front</button>
                              )}
                              {angle.key !== 'back' && (
                                <button type="button" onClick={() => handleSwapAngles(angle.key, 'back')} className="hover:text-white underline">Back</button>
                              )}
                              {angle.key !== 'left' && angle.key !== 'right' && (
                                <button type="button" onClick={() => handleSwapAngles(angle.key, 'left')} className="hover:text-white underline">Side</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Title */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Monochrome Heavyweight Oversized Tee"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                />
              </div>

              {/* Store Selection */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Store *</label>
                <select
                  required
                  disabled={isStoreOwner}
                  value={productForm.storeId}
                  onChange={(e) => {
                    const selectedStore = storesList.find(s => s._id === e.target.value);
                    setProductForm({
                      ...productForm,
                      storeId: e.target.value,
                      storeName: selectedStore ? selectedStore.name : ''
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold cursor-pointer focus:outline-none focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select a Store</option>
                  {storesList.map(store => (
                    <option key={store._id} value={store._id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Subcategory *</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold cursor-pointer"
                  >
                    <option value="Oversized T-Shirts">Oversized T-Shirts</option>
                    <option value="Drop Shoulder T-Shirts">Drop Shoulder T-Shirts</option>
                    <option value="Polo T-Shirts">Polo T-Shirts</option>
                    <option value="Shirts">Shirts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Price & MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="1499"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Original MRP Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="2499"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Sizes (comma separated)</label>
                <input
                  type="text"
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                  placeholder="S, M, L, XL, XXL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Details regarding 240+ GSM French Terry cotton fabric, boxy fit..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                ></textarea>
              </div>

              {/* Submit */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex-1 py-3 rounded-xl bg-white text-zinc-950 font-black uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingProduct ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
