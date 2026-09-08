import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_BASE_URL, API_ORIGIN, resolveImageUrl } from '../config/api';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // ─── Hydration gate: AsyncStorage loads asynchronously on mount ───────────
  const [isHydrated, setIsHydrated] = useState(false);

  // ─── Products ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false);

  // ─── Location & Multi-Store ───────────────────────────────────────────────
  const [locationStatus, setLocationStatus] = useState('idle'); // idle|detecting|granted|denied|out_of_range
  const [userLocation, setUserLocation] = useState(null);
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);

  // ─── Categories ───────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // ─── Cart & Wishlist ──────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  // ─── UI State ─────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOrderConfirmedOpen, setIsOrderConfirmedOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // ─── Promo ────────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // ─── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const locationInitialized = useRef(false);

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── HYDRATE from AsyncStorage on mount ──────────────────────────────────
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const [cartData, wishlistData, userData, tokenData, locData] = await Promise.all([
          AsyncStorage.getItem('quickfit_cart'),
          AsyncStorage.getItem('quickfit_wishlist'),
          AsyncStorage.getItem('quickfit_user'),
          AsyncStorage.getItem('quickfit_token'),
          AsyncStorage.getItem('quickfit_verified_location'),
        ]);
        if (cartData) setCart(JSON.parse(cartData));
        if (wishlistData) setWishlist(JSON.parse(wishlistData));
        if (userData) setUser(JSON.parse(userData));
        if (tokenData) setToken(tokenData);
        if (locData) {
          const parsed = JSON.parse(locData);
          setVerifiedLocation(parsed);
          if (parsed?.lat && parsed?.lng) setUserLocation({ lat: parsed.lat, lng: parsed.lng });
          setNearbyStores(parsed?.allNearbyStores || []);
          setLocationStatus(parsed?.inZone ? 'granted' : 'out_of_range');
        }
      } catch (e) {
        console.error('[ShopContext] Hydration error:', e);
      } finally {
        setIsHydrated(true);
      }
    };
    loadPersistedState();
  }, []);

  // ─── Persist cart & wishlist ──────────────────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('quickfit_cart', JSON.stringify(cart)).catch(() => {});
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem('quickfit_wishlist', JSON.stringify(wishlist)).catch(() => {});
  }, [wishlist, isHydrated]);

  // ─── normalizeProduct ─────────────────────────────────────────────────────
  const normalizeProduct = useCallback((p) => {
    const front = resolveImageUrl(p.images?.front || p.image);
    const back  = p.images?.back  ? resolveImageUrl(p.images.back)  : '';
    const left  = p.images?.left  ? resolveImageUrl(p.images.left)  : '';
    const right = p.images?.right ? resolveImageUrl(p.images.right) : '';
    const stockQty = p.stockQuantity !== undefined && !isNaN(Number(p.stockQuantity))
      ? Number(p.stockQuantity) : 25;
    return {
      ...p,
      id: p._id || p.id,
      _id: p._id || p.id,
      name: p.name || 'QuickFit Apparel',
      category: p.category || 'Men',
      subcategory: p.subcategory || 'Oversized T-Shirts',
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      discount: p.discount || '',
      rating: p.rating !== undefined ? Number(p.rating) : 4.9,
      reviewsCount: p.reviewsCount !== undefined ? Number(p.reviewsCount) : 24,
      expressDelivery: p.expressDelivery || 'Express Delivery',
      boutique: p.boutique || 'QuickFit Central, Vijayawada',
      stockQuantity: stockQty,
      inStock: p.inStock !== undefined ? p.inStock : stockQty > 0,
      featured: p.featured !== undefined ? p.featured : true,
      badge: p.badge || 'Bestseller',
      description: p.description || 'Premium heavyweight cotton streetwear.',
      sizes: Array.isArray(p.sizes) && p.sizes.length > 0
        ? p.sizes
        : (typeof p.sizes === 'string' ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL', 'XXL']),
      colors: Array.isArray(p.colors) && p.colors.length > 0
        ? p.colors : [{ name: 'Standard', hex: '#000000' }],
      image: front,
      images: { front, back, left, right },
      distanceKm: p.distanceKm ?? null,
      estimatedMinutes: p.estimatedMinutes ?? null,
      storeName: p.storeName || '',
      storeAddress: p.storeAddress || '',
    };
  }, []);

  // ─── fetchProducts ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (locationOverride) => {
    setIsLoadingProducts(true);
    setProductsError(null);
    setIsBackendWaking(false);

    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000;
    const RETRY_DELAYS = [3000, 7000, 15000];

    let loc = locationOverride || null;
    if (!loc) {
      try {
        const verifiedRaw = await AsyncStorage.getItem('quickfit_verified_location');
        const basicRaw    = await AsyncStorage.getItem('quickfit_location');
        const raw = verifiedRaw || basicRaw;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.lat && parsed?.lng) loc = { lat: parsed.lat, lng: parsed.lng };
        }
      } catch {}
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt === 2) setIsBackendWaking(true);
        let res;
        if (loc?.lat && loc?.lng) {
          console.log(`[PRODUCT FETCH] Attempt ${attempt}/${MAX_RETRIES} → /products/nearby`);
          res = await axios.get(`${API_BASE_URL}/products/nearby`, {
            params: { lat: loc.lat, lng: loc.lng, _t: Date.now() },
            timeout: TIMEOUT_MS,
          });
          setIsBackendWaking(false);
          const data = res.data;
          if (!data.inZone) {
            setLocationStatus('out_of_range');
            setNearbyStores([]);
            const closest = data.closestStore || null;
            const verifiedData = {
              lat: loc.lat, lng: loc.lng, nearestStore: closest,
              inZone: false, verificationStatus: 'out_of_range',
              areaName: closest?.name || 'Outside Delivery Zone', allNearbyStores: [],
            };
            try {
              await AsyncStorage.setItem('quickfit_verified_location', JSON.stringify(verifiedData));
              await AsyncStorage.setItem('quickfit_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
            } catch {}
            setVerifiedLocation(verifiedData);
            const fallbackRes = await axios.get(`${API_BASE_URL}/products`, { params: { _t: Date.now() }, timeout: TIMEOUT_MS });
            const rawData = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
            setProducts(rawData.map(normalizeProduct));
            setIsLoadingProducts(false);
            return;
          }
          const normalized = (data.products || []).map(normalizeProduct);
          const nearbyList = data.nearbyStores || [];
          setNearbyStores(nearbyList);
          setProducts(normalized);
          setIsLoadingProducts(false);
          const nearest = nearbyList[0] || null;
          const areaName = nearest?.address?.split(',')?.[0]?.trim() || nearest?.name || 'Vijayawada';
          const verifiedData = {
            lat: loc.lat, lng: loc.lng, nearestStore: nearest,
            inZone: true, verificationStatus: 'verified', areaName, allNearbyStores: nearbyList,
          };
          try {
            await AsyncStorage.setItem('quickfit_verified_location', JSON.stringify(verifiedData));
            await AsyncStorage.setItem('quickfit_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
          } catch {}
          setVerifiedLocation(verifiedData);
          setLocationStatus('granted');
          return;
        } else {
          console.log(`[PRODUCT FETCH] Attempt ${attempt}/${MAX_RETRIES} → /products (no location)`);
          res = await axios.get(`${API_BASE_URL}/products`, { params: { _t: Date.now() }, timeout: TIMEOUT_MS });
          setIsBackendWaking(false);
          const rawData = Array.isArray(res.data) ? res.data : [];
          setNearbyStores([]);
          setProducts(rawData.map(normalizeProduct));
          setIsLoadingProducts(false);
          return;
        }
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        console.warn(`[PRODUCT FETCH] Attempt ${attempt} failed:`, err.message);
        if (!isLast) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1] || 5000));
          continue;
        }
        setIsBackendWaking(false);
        let errorMsg;
        if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
          errorMsg = 'Server is slow. Please wait and tap Retry.';
        } else if (!err.response) {
          errorMsg = 'Network error. Please check your connection and tap Retry.';
        } else {
          errorMsg = err.response?.data?.message || err.message || 'Unable to load products. Tap Retry.';
        }
        setProductsError(errorMsg);
        setProducts([]);
      }
    }
    setIsLoadingProducts(false);
  }, [normalizeProduct]);

  // ─── detectUserLocation (expo-location) ──────────────────────────────────
  const detectUserLocation = useCallback(async (force = false) => {
    if (!force) {
      try {
        const saved = await AsyncStorage.getItem('quickfit_verified_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && typeof parsed.lat === 'number' && parsed?.lng && typeof parsed.lng === 'number') {
            setVerifiedLocation(parsed);
            setUserLocation({ lat: parsed.lat, lng: parsed.lng });
            setNearbyStores(parsed.allNearbyStores || []);
            setLocationStatus(parsed.inZone ? 'granted' : 'out_of_range');
            fetchProducts({ lat: parsed.lat, lng: parsed.lng });
            return;
          }
        }
      } catch {}
    }

    setLocationStatus('detecting');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[GEO] Location permission denied.');
        setLocationStatus('denied');
        // Fall back to last known location or no-location fetch
        try {
          const fallback = await AsyncStorage.getItem('quickfit_location');
          if (fallback) {
            const parsed = JSON.parse(fallback);
            fetchProducts({ lat: parsed.lat, lng: parsed.lng });
            return;
          }
        } catch {}
        fetchProducts(null);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
      await AsyncStorage.setItem('quickfit_location', JSON.stringify(loc));
      setUserLocation(loc);
      fetchProducts(loc);
    } catch (err) {
      console.warn('[GEO] Error getting location:', err.message);
      setLocationStatus('denied');
      fetchProducts(null);
    }
  }, [fetchProducts]);

  const resetLocation = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['quickfit_verified_location', 'quickfit_location']);
    } catch {}
    setVerifiedLocation(null);
    setUserLocation(null);
    setNearbyStores([]);
    setLocationStatus('idle');
    detectUserLocation(true);
  }, [detectUserLocation]);

  // ─── fetchCategories ──────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 5000, 10000];
    setIsLoadingCategories(true);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/categories`, {
          params: { _t: Date.now() }, timeout: 20000,
        });
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length > 0) {
          setCategories(data);
          setIsLoadingCategories(false);
          return;
        }
      } catch (err) {
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
      }
    }
    setIsLoadingCategories(false);
  }, []);

  // ─── Lifecycle: categories & products sync with AppState ─────────────────
  useEffect(() => {
    fetchCategories();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') fetchCategories();
    });
    const interval = setInterval(fetchCategories, 60000);
    return () => { sub.remove(); clearInterval(interval); };
  }, [fetchCategories]);

  useEffect(() => {
    if (!isHydrated) return;
    if (locationInitialized.current) return;
    locationInitialized.current = true;

    const init = async () => {
      try {
        const verifiedRaw = await AsyncStorage.getItem('quickfit_verified_location');
        if (verifiedRaw) {
          const parsed = JSON.parse(verifiedRaw);
          if (parsed?.lat && parsed?.lng) { fetchProducts(parsed); return; }
        }
        const basicRaw = await AsyncStorage.getItem('quickfit_location');
        if (basicRaw) {
          const parsed = JSON.parse(basicRaw);
          if (parsed?.lat && parsed?.lng) { fetchProducts(parsed); return; }
        }
      } catch {}
      detectUserLocation(false);
    };
    init();

    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          const raw = await AsyncStorage.getItem('quickfit_location');
          const loc = raw ? JSON.parse(raw) : null;
          fetchProducts(loc);
        } catch { fetchProducts(null); }
      }
    });
    const interval = setInterval(async () => {
      try {
        const raw = await AsyncStorage.getItem('quickfit_location');
        const loc = raw ? JSON.parse(raw) : null;
        fetchProducts(loc);
      } catch {}
    }, 60000);
    return () => { sub.remove(); clearInterval(interval); };
  }, [isHydrated, fetchProducts, detectUserLocation]);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const loginUser = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setUser(res.data);
      setToken(res.data.token);
      await AsyncStorage.setItem('quickfit_user', JSON.stringify(res.data));
      await AsyncStorage.setItem('quickfit_token', res.data.token);
      showToast(`Welcome back, ${res.data.name}!`);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const logoutUser = async () => {
    setUser(null);
    setToken('');
    await AsyncStorage.multiRemove(['quickfit_user', 'quickfit_token']);
    showToast('Logged out successfully.', 'info');
  };

  // ─── Cart ─────────────────────────────────────────────────────────────────
  const addToCart = (product, size = 'M', color = 'Standard') => {
    if (!product || !product.name || (!product.id && !product._id)) {
      showToast('Unable to add item — product data is missing.', 'error'); return;
    }
    const stock = product.stockQuantity !== undefined ? product.stockQuantity : 25;
    if (stock <= 0 || product.inStock === false) {
      showToast(`"${product.name}" is Out of Stock.`, 'error'); return;
    }
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => (item.id === product.id || item.id === product._id) && item.selectedSize === size && item.selectedColor === color
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        if (updated[existingIndex].quantity >= stock) {
          showToast(`Only ${stock} in stock.`, 'warning'); return prevCart;
        }
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      const cartItem = {
        id: String(product.id || product._id),
        _id: String(product._id || product.id),
        product: String(product.id || product._id),
        name: product.name, price: product.price, originalPrice: product.originalPrice,
        image: product.image || '', images: product.images || {},
        category: product.category || '', subcategory: product.subcategory || '',
        sizes: product.sizes || [], colors: product.colors || [],
        stockQuantity: product.stockQuantity, inStock: product.inStock,
        badge: product.badge || '', boutique: product.boutique || '',
        selectedSize: size, selectedColor: color || 'Standard',
        size, color: color || 'Standard', quantity: 1,
      };
      return [...prevCart, cartItem];
    });
    showToast(`Added "${product.name}" to Bag!`);
  };

  const buyNow = (product, size = 'M', color = 'Standard') => {
    if (!product || !product.name || (!product.id && !product._id)) {
      showToast('Unable to proceed — product data is missing.', 'error'); return false;
    }
    const stock = product.stockQuantity !== undefined ? product.stockQuantity : 25;
    if (stock <= 0 || product.inStock === false) {
      showToast(`"${product.name}" is Out of Stock.`, 'error'); return false;
    }
    const buyNowItem = {
      id: String(product.id || product._id), _id: String(product._id || product.id),
      product: String(product.id || product._id),
      name: product.name, price: Number(product.price) || 0,
      originalPrice: product.originalPrice, image: product.image || '',
      images: product.images || {}, category: product.category || '',
      subcategory: product.subcategory || '', sizes: product.sizes || [],
      colors: product.colors || [], stockQuantity: stock, inStock: true,
      badge: product.badge || '', boutique: product.boutique || '',
      selectedSize: size || 'M', size: size || 'M',
      selectedColor: color || 'Standard', color: color || 'Standard', quantity: 1,
    };
    setCart([buyNowItem]);
    return true;
  };

  const updateQuantity = (id, size, color, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
          const newQty = item.quantity + delta;
          const stock = item.stockQuantity !== undefined ? item.stockQuantity : 99;
          if (newQty > stock) { showToast(`Only ${stock} in stock.`, 'warning'); return item; }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (id, size, color) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
    showToast('Item removed from bag.', 'info');
  };

  const clearCart = () => { setCart([]); setAppliedPromo(null); };

  // ─── Wishlist ─────────────────────────────────────────────────────────────
  const toggleWishlist = (product) => {
    const prodId = product.id || product._id;
    setWishlist((prev) => {
      const exists = prev.some((item) => (item.id || item._id) === prodId);
      if (exists) {
        showToast(`Removed "${product.name}" from Wishlist.`, 'info');
        return prev.filter((item) => (item.id || item._id) !== prodId);
      }
      showToast(`Saved "${product.name}" to Wishlist!`);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => wishlist.some((item) => item.id === productId || item._id === productId);

  // ─── Promo ────────────────────────────────────────────────────────────────
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    setPromoError('');
    if (!code) { setPromoError('Please enter a coupon code.'); return; }
    if (code === 'QUICK60' || code === 'FIRSTFIT') {
      const discount = code === 'QUICK60' ? 150 : 200;
      setAppliedPromo({ code, discount, type: 'flat' });
      showToast(`Promo "${code}" applied! Rs.${discount} saved.`);
      setPromoCode('');
    } else {
      setPromoError('Invalid coupon code. Try QUICK60');
    }
  };

  const removePromo = () => { setAppliedPromo(null); showToast('Coupon removed.', 'info'); };

  // ─── Cart Calculations ────────────────────────────────────────────────────
  const cartSubtotal    = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount  = appliedPromo ? appliedPromo.discount : 0;
  const deliveryFee     = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 49;
  const cartGrandTotal  = Math.max(0, cartSubtotal - discountAmount + (cart.length > 0 ? deliveryFee : 0));
  const totalCartCount  = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openProductDetail = (product) => { setSelectedProduct(product); };

  return (
    <ShopContext.Provider value={{
      isHydrated,
      products, setProducts, isLoadingProducts, productsError, isBackendWaking, fetchProducts,
      locationStatus, userLocation, verifiedLocation, setVerifiedLocation, nearbyStores,
      detectUserLocation, resetLocation,
      categories, isLoadingCategories, fetchCategories,
      cart, wishlist,
      searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
      selectedSubcategory, setSelectedSubcategory, sortBy, setSortBy,
      user, setUser, token, setToken, loginUser, logoutUser,
      selectedProduct, setSelectedProduct, openProductDetail,
      isAdminOpen, setIsAdminOpen,
      isOrderConfirmedOpen, setIsOrderConfirmedOpen,
      lastOrder, setLastOrder,
      addToCart, buyNow, updateQuantity, removeFromCart, clearCart,
      toggleWishlist, isInWishlist,
      promoCode, setPromoCode, appliedPromo, promoError, applyPromoCode, removePromo,
      cartSubtotal, discountAmount, deliveryFee, cartGrandTotal, totalCartCount,
      toast, showToast,
      API_BASE_URL, API_ORIGIN, resolveImageUrl,
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
