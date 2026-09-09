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
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);

  // Ref to track userLocation for focus and periodic sync without stale closures or localStorage reads
  const userLocationRef = useRef(null);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Ref to avoid triggering location check more than once on initial mount
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

  // Tracks whether a checkout should auto-open after the user logs in/registers
  // Set to true when an unauthenticated user tries to checkout.
  const [checkoutRedirectPending, setCheckoutRedirectPending] = useState(false);

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

    // Resolve location: use override if provided (pass null explicitly for global catalog)
    // or fall back to active session location (userLocationRef)
    let loc = locationOverride !== undefined ? locationOverride : userLocationRef.current;

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
            // Customer is outside 60-min express delivery zone — show banner but DO NOT hide catalog!
            setLocationStatus('out_of_range');
            setNearbyStores([]);
            setProductsError(null);

            const closest = data.closestStore || null;
            const verifiedData = {
              lat: loc.lat,
              lng: loc.lng,
              nearestStore: closest,
              inZone: false,
              verificationStatus: 'out_of_range',
              areaName: closest?.name || 'Outside Delivery Zone',
              allNearbyStores: []
            };
            try {
              sessionStorage.setItem('quickfit_session_verified_location', JSON.stringify(verifiedData));
              sessionStorage.setItem('quickfit_session_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
            } catch (e) {}
            setVerifiedLocation(verifiedData);

            console.log('[PRODUCT FETCH] Outside express zone. Loading complete product catalog for browsing & standard delivery...');
            const fallbackRes = await axios.get(`${API_BASE_URL}/products`, {
              params: { _t: Date.now() },
              timeout: TIMEOUT_MS
            });
            const rawData = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
            const normalized = rawData.map(normalizeProduct);
            setProducts(normalized);
            setIsLoadingProducts(false);
            console.log(`[PRODUCT FETCH] ✅ /products fallback: ${normalized.length} products loaded`);
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
            lat: loc.lat,
            lng: loc.lng,
            nearestStore: nearest,
            inZone: true,
            verificationStatus: 'verified',
            areaName,
            allNearbyStores: nearbyList
          };
          try {
            sessionStorage.setItem('quickfit_session_verified_location', JSON.stringify(verifiedData));
            sessionStorage.setItem('quickfit_session_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
          } catch (e) {}
          setVerifiedLocation(verifiedData);
          setLocationStatus('granted');

          console.log(`[PRODUCT FETCH] ✅ /nearby: ${normalized.length} products from ${nearbyList.length} stores (Area: ${areaName})`);
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
  // Geolocation detection — asks permission on visit/session via standard popup
  // ─────────────────────────────────────────────────────────────────────────────
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('[GEO] Geolocation not supported by this browser.');
      setLocationStatus('denied');
      setUserLocation(null);
      setVerifiedLocation(null);
      setNearbyStores([]);
      fetchProducts(null);
      return;
    }

    setLocationStatus('detecting');

    const handleSuccess = (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      console.log(`[GEO] Location granted: lat=${loc.lat}, lng=${loc.lng}`);
      setUserLocation(loc);
      try {
        sessionStorage.setItem('quickfit_session_location', JSON.stringify(loc));
      } catch (e) {}
      fetchProducts(loc);
    };

    const handleFailure = (err) => {
      console.warn('[GEO] Location denied or unavailable:', err?.message, 'Code:', err?.code);
      setLocationStatus('denied');
      setUserLocation(null);
      setVerifiedLocation(null);
      setNearbyStores([]);
      try {
        sessionStorage.removeItem('quickfit_session_location');
        sessionStorage.removeItem('quickfit_session_verified_location');
        localStorage.removeItem('quickfit_location');
        localStorage.removeItem('quickfit_verified_location');
      } catch (e) {}
      // Seamless fallback to global product catalog
      fetchProducts(null);
    };

    // Mobile & Desktop Geolocation Request:
    // First attempt high accuracy (7s timeout).
    // If it fails with TIMEOUT or POSITION_UNAVAILABLE (typical on laptops/desktops without GPS hardware),
    // automatically fallback to standard network accuracy (8s timeout) for fast WiFi/IP location.
    // If the user explicitly blocked / denied permission (PERMISSION_DENIED), fail immediately without retry.
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          handleFailure(err);
          return;
        }
        console.warn('[GEO] High accuracy failed or timed out, retrying with standard network accuracy...');
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleFailure,
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  }, [fetchProducts]);

  /**
   * Clears saved location and re-runs geolocation detection.
   */
  const resetLocation = useCallback(() => {
    try {
      localStorage.removeItem('quickfit_verified_location');
      localStorage.removeItem('quickfit_location');
      sessionStorage.removeItem('quickfit_session_verified_location');
      sessionStorage.removeItem('quickfit_session_location');
    } catch (e) {}
    setVerifiedLocation(null);
    setUserLocation(null);
    setNearbyStores([]);
    setLocationStatus('idle');
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
          console.error('[CATEGORIES] All retries failed. Static fallback will be used.');
        }
      }
    }
    setIsLoadingCategories(false); // Settled (success or all retries exhausted)
  }, []);

  // Fetch categories on mount AND whenever the tab regains focus
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

    // Clear legacy persistent location so returning visitors are never silently tracked
    try {
      localStorage.removeItem('quickfit_verified_location');
      localStorage.removeItem('quickfit_location');
    } catch (e) {}

    // Ask for location permission on every new website visit/session
    detectUserLocation();

    // Auto-refresh products when tab regains focus (using current active session location)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts(userLocationRef.current);
      }
    };
    const handleFocus = () => {
      fetchProducts(userLocationRef.current);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 60 seconds
    const interval = setInterval(() => {
      fetchProducts(userLocationRef.current);
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
    setCheckoutRedirectPending(false);
    showToast('Logged out successfully.', 'info');
    // After logout, stay on homepage — do NOT redirect to /login
    window.history.replaceState({ modal: 'home' }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
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
        product: String(product.id || product._id),
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
        size: size,
        color: color || 'Standard',
        quantity: 1
      };
      return [...prevCart, cartItem];
    });
    showToast(`Added "${product.name}" to Bag! 🛍️`);
  };

  const buyNow = (product, size = 'M', color = 'Standard') => {
    if (!product || !product.name || (!product.id && !product._id)) {
      console.error('[BUY NOW] Attempted to buy invalid product:', product);
      showToast('Unable to proceed — product data is missing.', 'error');
      return;
    }
    const stock = product.stockQuantity !== undefined ? product.stockQuantity : 25;
    if (stock <= 0 || product.inStock === false) {
      showToast(`"${product.name}" is Out of Stock.`, 'error');
      return;
    }

    const frontImg = resolveImageUrl(product.images?.front || product.image);
    const buyNowItem = {
      id: String(product.id || product._id),
      _id: String(product._id || product.id),
      product: String(product.id || product._id),
      name: product.name,
      price: Number(product.price) || 0,
      originalPrice: product.originalPrice,
      image: frontImg,
      images: product.images || { front: frontImg },
      category: product.category || '',
      subcategory: product.subcategory || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      stockQuantity: stock,
      inStock: product.inStock !== false,
      badge: product.badge || '',
      boutique: product.boutique || '',
      selectedSize: size || 'M',
      size: size || 'M',
      selectedColor: color || 'Standard',
      color: color || 'Standard',
      quantity: 1
    };

    // Pre-populate cart with the selected product regardless of auth state
    setCart([buyNowItem]);
    setIsDetailModalOpen(false);
    setIsCartOpen(false);

    // AUTH GATE: only open checkout if the user is already logged in.
    // Otherwise redirect to /login and flag that checkout should open after auth.
    const currentUser = (() => {
      try { return JSON.parse(localStorage.getItem('quickfit_user')); } catch { return null; }
    })();
    const currentToken = localStorage.getItem('quickfit_token');
    if (currentUser && currentToken) {
      setIsCheckoutOpen(true);
    } else {
      setCheckoutRedirectPending(true);
      showToast('Please sign in to complete your order.', 'info');
      window.history.pushState({ modal: 'login', redirect: 'checkout' }, '', '/login?redirect=checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
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
        checkoutRedirectPending,
        setCheckoutRedirectPending,
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
        verifiedLocation,
        setVerifiedLocation,
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
        buyNow,
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
