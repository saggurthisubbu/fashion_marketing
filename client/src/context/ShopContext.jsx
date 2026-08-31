import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ORIGIN, resolveImageUrl } from '../config/api';
import { checkDeliveryAvailability } from '../utils/deliveryRadius';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // --- STATE MANAGEMENT ---
  // MongoDB is the single source of truth. No static array defaults.
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false); // Render cold-start indicator

  // --- LOCATION & MULTI-STORE STATE ---
  // locationStatus: 'idle' | 'detecting' | 'granted' | 'denied' | 'out_of_range'
  const [locationStatus, setLocationStatus] = useState('idle');
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfit_location');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [nearbyStores, setNearbyStores] = useState([]);
  // Ref to avoid triggering fetchProducts more than once on mount
  const locationInitialized = useRef(false);

  // Live categories from MongoDB (single source of truth for the whole app)
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfit_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfit_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // User & Auth State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('quickfit_token') || '');

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderConfirmedOpen, setIsOrderConfirmedOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Last Generated Order
  const [lastOrder, setLastOrder] = useState(null);

  // Promo Coupon System
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Cart & Wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('quickfit_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('quickfit_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Normalize a raw product object (works for both /products and /products/nearby)
  // ─────────────────────────────────────────────────────────────────────────────
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
      // Geo fields — present only when fetched via /nearby
      distanceKm: p.distanceKm ?? null,
      estimatedMinutes: p.estimatedMinutes ?? null,
      storeName: p.storeName || '',
      storeAddress: p.storeAddress || ''
    };
  }, []);

  // --- FETCH PRODUCTS DYNAMICALLY FROM MONGODB VIA BACKEND API ---
  const fetchProducts = useCallback(async (locationOverride) => {
    setIsLoadingProducts(true);
    setProductsError(null);
    setIsBackendWaking(false);

    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000;
    const RETRY_DELAYS = [3000, 7000, 15000];

    // Resolve location: prefer override (from detectUserLocation), then localStorage
    let loc = locationOverride || null;
    if (!loc) {
      try {
        const saved = localStorage.getItem('quickfit_location');
        if (saved) loc = JSON.parse(saved);
      } catch { loc = null; }
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt === 2) setIsBackendWaking(true);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        let res;
        if (loc?.lat && loc?.lng) {
          // ── LOCATION-AWARE: use /nearby endpoint ──────────────────────────
          console.log(`[PRODUCT FETCH] Attempt ${attempt}/${MAX_RETRIES} → /products/nearby lat=${loc.lat} lng=${loc.lng}`);
          res = await axios.get(`${API_BASE_URL}/products/nearby`, {
            params: { lat: loc.lat, lng: loc.lng, _t: Date.now() },
            signal: controller.signal,
            timeout: TIMEOUT_MS
          });
          clearTimeout(timer);
          setIsBackendWaking(false);

          const data = res.data;
          if (!data.inZone) {
            // Customer is outside all delivery zones
            setLocationStatus('out_of_range');
            setNearbyStores([]);
            setProducts([]);
            setIsLoadingProducts(false);
            setProductsError(data.message || 'We do not deliver to your current location.');
            return;
          }

          const normalized = (data.products || []).map(normalizeProduct);
          setNearbyStores(data.nearbyStores || []);
          setProducts(normalized);
          setIsLoadingProducts(false);
          console.log(`[PRODUCT FETCH] ✅ /nearby: ${normalized.length} products from ${(data.nearbyStores || []).length} stores`);
          return;

        } else {
          // ── NO LOCATION: fetch all products (global catalog) ───────────────
          console.log(`[PRODUCT FETCH] Attempt ${attempt}/${MAX_RETRIES} → /products (no location)`);
          res = await axios.get(`${API_BASE_URL}/products`, {
            params: { _t: Date.now() },
            signal: controller.signal,
            timeout: TIMEOUT_MS
          });
          clearTimeout(timer);
          setIsBackendWaking(false);

          const rawData = Array.isArray(res.data) ? res.data : [];
          const normalized = rawData.map(normalizeProduct);
          setNearbyStores([]);
          setProducts(normalized);
          setIsLoadingProducts(false);
          console.log(`[PRODUCT FETCH] ✅ /products: ${normalized.length} products (no location filter)`);
          return;
        }

      } catch (err) {
        const isLastAttempt = attempt === MAX_RETRIES;
        const isTimeout = err.code === 'ECONNABORTED' || err.name === 'AbortError' || err.code === 'ERR_CANCELED';
        const httpStatus = err.response?.status;
        console.warn(`[PRODUCT FETCH] ❌ Attempt ${attempt} failed:`, err.message);

        if (!isLastAttempt) {
          const delay = RETRY_DELAYS[attempt - 1] || 5000;
          console.log(`[PRODUCT FETCH] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        setIsBackendWaking(false);
        let errorMsg;
        if (isTimeout) {
          errorMsg = 'The server is taking too long to respond. Please wait 30 seconds and tap Retry.';
        } else if (!err.response) {
          errorMsg = 'Network error: Unable to reach the product server. Please check your connection and tap Retry.';
        } else if (httpStatus === 500) {
          errorMsg = 'Server error (500). Please tap Retry or contact support.';
        } else if (httpStatus === 503) {
          errorMsg = 'Service temporarily unavailable (503). Please tap Retry.';
        } else {
          errorMsg = err.response?.data?.message || err.message || 'Unable to load products. Please tap Retry.';
        }
        console.error('[PRODUCT FETCH ERROR] All retries failed:', errorMsg);
        setProductsError(errorMsg);
        setProducts([]);
      }
    }
    setIsLoadingProducts(false);
  }, [normalizeProduct]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Geolocation detection — called once on mount, or when user clicks "retry"
  // ─────────────────────────────────────────────────────────────────────────────
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('[GEO] Geolocation not supported by this browser.');
      setLocationStatus('denied');
      fetchProducts(null);
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        localStorage.setItem('quickfit_location', JSON.stringify(loc));
        setUserLocation(loc);
        setLocationStatus('granted');
        fetchProducts(loc);
      },
      (err) => {
        console.warn('[GEO] Location denied or unavailable:', err.message);
        setLocationStatus('denied');
        // Try to use previously saved location
        try {
          const saved = localStorage.getItem('quickfit_location');
          if (saved) {
            const loc = JSON.parse(saved);
            setUserLocation(loc);
            fetchProducts(loc);
            return;
          }
        } catch { /* ignore */ }
        fetchProducts(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchProducts]);

  /**
   * Clears saved location and re-runs geolocation detection.
   * Called by the LocationBanner "Change Location" button.
   */
  const resetLocation = useCallback(() => {
    localStorage.removeItem('quickfit_location');
    setUserLocation(null);
    setNearbyStores([]);
    detectUserLocation();
  }, [detectUserLocation]);

  // --- FETCH CATEGORIES FROM MONGODB ---
  const fetchCategories = useCallback(async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 5000, 10000];
    setIsLoadingCategories(true);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[CATEGORIES] Attempt ${attempt}/${MAX_RETRIES} → ${API_BASE_URL}/admin/categories`);
        const res = await axios.get(`${API_BASE_URL}/admin/categories`, {
          params: { _t: Date.now() }, // Cache-bust — forces fresh data past CDN/SW cache
          timeout: 20000
        });
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length > 0) {
          setCategories(data);
          console.log(`[CATEGORIES] ✅ Loaded ${data.length} categories from MongoDB (attempt ${attempt}).`);
          setIsLoadingCategories(false);
          return; // Success — stop retrying
        } else {
          console.warn(`[CATEGORIES] ⚠️ API returned empty array (attempt ${attempt}).`);
        }
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        console.warn(`[CATEGORIES] ❌ Attempt ${attempt} failed: ${err.message}`);
        if (!isLast) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
        } else {
          // All retries exhausted — keep whatever stale state we have (static fallback in CategoriesSection)
          console.error('[CATEGORIES] All retries failed. Static fallback will be used.');
        }
      }
    }
    setIsLoadingCategories(false); // Settled (success or all retries exhausted)
  }, []);

  // Fetch categories on mount AND whenever the tab regains focus (same pattern as products)
  useEffect(() => {
    fetchCategories();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCategories();
      }
    };
    const handleFocus = () => fetchCategories();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 60 seconds so admin edits appear automatically
    const interval = setInterval(fetchCategories, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchCategories]);



  useEffect(() => {
    if (locationInitialized.current) return;
    locationInitialized.current = true;

    // If we already have a saved location, use it immediately to fetch products,
    // then silently refresh geolocation in the background.
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem('quickfit_location')); } catch { return null; }
    })();

    if (saved?.lat && saved?.lng) {
      setLocationStatus('granted');
      fetchProducts(saved);
    } else {
      detectUserLocation();
    }

    // Auto-refresh products (but not location) when tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const loc = (() => {
          try { return JSON.parse(localStorage.getItem('quickfit_location')); } catch { return null; }
        })();
        fetchProducts(loc);
      }
    };
    const handleFocus = () => {
      const loc = (() => {
        try { return JSON.parse(localStorage.getItem('quickfit_location')); } catch { return null; }
      })();
      fetchProducts(loc);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 60 seconds
    const interval = setInterval(() => {
      const loc = (() => {
        try { return JSON.parse(localStorage.getItem('quickfit_location')); } catch { return null; }
      })();
      fetchProducts(loc);
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchProducts, detectUserLocation]);

  // --- AUTHENTICATION FUNCTIONS ---
  const loginUser = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setUser(res.data);
      setToken(res.data.token);
      localStorage.setItem('quickfit_user', JSON.stringify(res.data));
      localStorage.setItem('quickfit_token', res.data.token);
      showToast(`Welcome back, ${res.data.name}! 👋`);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('quickfit_user');
    localStorage.removeItem('quickfit_token');
    showToast('Logged out successfully.', 'info');
  };

  // --- CART FUNCTIONS ---
  const addToCart = (product, size = 'M', color = 'Standard') => {
    // Guard: reject null/undefined or incomplete products
    if (!product || !product.name || (!product.id && !product._id)) {
      console.error('[CART] Attempted to add invalid product to cart:', product);
      showToast('Unable to add item — product data is missing.', 'error');
      return;
    }
    const stock = product.stockQuantity !== undefined ? product.stockQuantity : 25;
    if (stock <= 0 || product.inStock === false) {
      showToast(`"${product.name}" is Out of Stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => (item.id === product.id || item.id === product._id) && item.selectedSize === size && item.selectedColor === color
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        if (updated[existingIndex].quantity >= stock) {
          showToast(`Only ${stock} in stock.`, 'warning');
          return prevCart;
        }
        updated[existingIndex].quantity += 1;
        return updated;
      }
      // Build a clean, serializable cart item (no ObjectId/circular refs)
      const cartItem = {
        id: String(product.id || product._id),
        _id: String(product._id || product.id),
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image || '',
        images: product.images || {},
        category: product.category || '',
        subcategory: product.subcategory || '',
        sizes: product.sizes || [],
        colors: product.colors || [],
        stockQuantity: product.stockQuantity,
        inStock: product.inStock,
        badge: product.badge || '',
        boutique: product.boutique || '',
        selectedSize: size,
        selectedColor: color || 'Standard',
        quantity: 1
      };
      return [...prevCart, cartItem];
    });
    showToast(`Added "${product.name}" to Bag! 🛍️`);
  };

  const updateQuantity = (id, size, color, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
            const newQty = item.quantity + delta;
            const stock = item.stockQuantity !== undefined ? item.stockQuantity : 99;
            if (newQty > stock) {
              showToast(`Only ${stock} in stock.`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (id, size, color) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.selectedSize === size && item.selectedColor === color))
    );
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  // --- WISHLIST FUNCTIONS ---
  const toggleWishlist = (product) => {
    const prodId = product.id || product._id;
    setWishlist((prev) => {
      const exists = prev.some((item) => (item.id || item._id) === prodId);
      if (exists) {
        showToast(`Removed "${product.name}" from Wishlist.`, 'info');
        return prev.filter((item) => (item.id || item._id) !== prodId);
      } else {
        showToast(`Saved "${product.name}" to Wishlist! ❤️`);
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) =>
    wishlist.some((item) => item.id === productId || item._id === productId);

  // --- PROMO COUPON SYSTEM ---
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    setPromoError('');

    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    if (code === 'QUICK60' || code === 'FIRSTFIT') {
      const discount = code === 'QUICK60' ? 150 : 200;
      setAppliedPromo({ code, discount, type: 'flat' });
      showToast(`Promo "${code}" applied! ₹${discount} saved. 🎉`);
      setPromoCode('');
    } else {
      setPromoError('Invalid coupon code. Try QUICK60');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    showToast('Coupon removed.', 'info');
  };

  // --- TOTAL CALCULATIONS ---
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const deliveryFee = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 49;
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount + (cart.length > 0 ? deliveryFee : 0));
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick View Modal
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        setProducts,
        isLoadingProducts,
        categories,
        fetchCategories,
        isLoadingCategories,
        isBackendWaking,
        productsError,
        fetchProducts,
        // Location & multi-store
        locationStatus,
        userLocation,
        nearbyStores,
        detectUserLocation,
        resetLocation,
        cart,
        wishlist,
        user,
        setUser,
        token,
        setToken,
        loginUser,
        logoutUser,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        sortBy,
        setSortBy,
        selectedProduct,
        setSelectedProduct,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isOrderConfirmedOpen,
        setIsOrderConfirmedOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isAdminOpen,
        setIsAdminOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isContactOpen: isContactModalOpen,
        setIsContactOpen: setIsContactModalOpen,
        isContactModalOpen,
        setIsContactModalOpen,
        isAboutModalOpen,
        setIsAboutModalOpen,
        lastOrder,
        setLastOrder,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        promoCode,
        setPromoCode,
        appliedPromo,
        promoError,
        applyPromoCode,
        removePromo,
        cartSubtotal,
        discountAmount,
        deliveryFee,
        cartGrandTotal,
        totalCartCount,
        openProductDetail,
        toast,
        showToast,
        API_BASE_URL,
        API_ORIGIN,
        resolveImageUrl
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
