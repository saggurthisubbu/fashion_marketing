import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ORIGIN, resolveImageUrl } from '../config/api';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // --- STATE MANAGEMENT ---
  // MongoDB is the single source of truth. No static array defaults.
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

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

  // --- FETCH PRODUCTS DYNAMICALLY FROM MONGODB VIA BACKEND API ---
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      console.log('[PRODUCT FETCH] Requesting products from MongoDB API endpoint:', `${API_BASE_URL}/products`);
      const res = await axios.get(`${API_BASE_URL}/products`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const rawData = Array.isArray(res.data) ? res.data : [];

      // Normalize MongoDB documents and dynamically resolve multi-angle images
      const normalized = rawData.map((p) => {
        const front = resolveImageUrl(p.images?.front || p.image);
        const back = p.images?.back ? resolveImageUrl(p.images.back) : '';
        const left = p.images?.left ? resolveImageUrl(p.images.left) : '';
        const right = p.images?.right ? resolveImageUrl(p.images.right) : '';

        const stockQty = p.stockQuantity !== undefined && !isNaN(Number(p.stockQuantity))
          ? Number(p.stockQuantity)
          : 25;

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
            ? p.colors
            : [{ name: 'Standard', hex: '#000000' }],
          image: front,
          images: {
            front,
            back,
            left,
            right
          }
        };
      });

      setProducts(normalized);
      console.log(`[PRODUCT FETCH] Successfully loaded ${normalized.length} products dynamically from MongoDB Atlas.`);
    } catch (err) {
      console.error('[PRODUCT FETCH ERROR] Failed to fetch products from backend API:', err.message);
      setProductsError(err.response?.data?.message || err.message || 'Unable to connect to database API.');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Auto-refresh when tab gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchProducts);

    // Periodic sync every 20 seconds
    const interval = setInterval(fetchProducts, 20000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchProducts);
      clearInterval(interval);
    };
  }, [fetchProducts]);

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
      return [
        ...prevCart,
        {
          ...product,
          id: product.id || product._id,
          selectedSize: size,
          selectedColor: color,
          quantity: 1
        }
      ];
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
        productsError,
        fetchProducts,
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
