import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { productsData } from '../data/products';

const ShopContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const ShopProvider = ({ children }) => {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState(productsData);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState(6000);

  // User & Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quickfit_user');
    return saved ? JSON.parse(saved) : null;
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

  // --- FETCH PRODUCTS FROM BACKEND ---
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/products`);
      if (res.data && res.data.length > 0) {
        // Normalize MongoDB _id to id for consistency
        const normalized = res.data.map(p => ({ ...p, id: p._id || p.id }));
        setProducts(normalized);
      }
    } catch (err) {
      console.warn('[ShopContext]: Server connection offline, using fallback catalog data.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
  const addToCart = (product, size = 'M', color = '') => {
    if (product.stockQuantity <= 0 || product.inStock === false) {
      showToast(`Sorry! "${product.name}" is currently Out of Stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        if (updated[existingIndex].quantity >= product.stockQuantity) {
          showToast(`Cannot add more. Only ${product.stockQuantity} in stock.`, 'warning');
          return prevCart;
        }
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { ...product, selectedSize: size, selectedColor: color, quantity: 1 }];
    });
    showToast(`Added "${product.name}" to cart! ⚡ Express 60-min delivery queued.`);
  };

  const updateQuantity = (id, size, color, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (id, size, color) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
    setPromoCode('');
  };

  // --- WISHLIST FUNCTIONS ---
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from Wishlist.`, 'info');
        return prev.filter((item) => item.id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to Wishlist! ❤️`);
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.some((item) => item.id === productId);

  // --- PROMO CODE LOGIC ---
  const applyPromoCode = (codeToApply) => {
    const cleanCode = (codeToApply || promoCode).trim().toUpperCase();
    if (cleanCode === 'QUICK10') {
      setAppliedPromo({ code: 'QUICK10', discountPercent: 10, label: '10% OFF QuickFit Special' });
      setPromoError('');
      showToast('Promo code QUICK10 applied! 10% OFF');
    } else if (cleanCode === 'VIJAYAWADA') {
      setAppliedPromo({ code: 'VIJAYAWADA', discountPercent: 15, label: '15% OFF Vijayawada Express' });
      setPromoError('');
      showToast('Promo code VIJAYAWADA applied! 15% OFF');
    } else if (cleanCode === 'EXPRESS50') {
      setAppliedPromo({ code: 'EXPRESS50', discountFlat: 50, label: '₹50 Instant Discount' });
      setPromoError('');
      showToast('Promo code EXPRESS50 applied! ₹50 Instant Off');
    } else {
      setPromoError('Invalid Promo Code. Try "QUICK10" or "VIJAYAWADA"');
      setAppliedPromo(null);
    }
  };

  // --- CALCULATIONS ---
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountPercent) {
      discountAmount = Math.round((cartSubtotal * appliedPromo.discountPercent) / 100);
    } else if (appliedPromo.discountFlat) {
      discountAmount = Math.min(appliedPromo.discountFlat, cartSubtotal);
    }
  }

  const deliveryFee = cartSubtotal >= 1999 || cartSubtotal === 0 ? 0 : 49;
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- QUICK VIEW MODAL ---
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        setProducts,
        fetchProducts,
        cart,
        wishlist,
        user,
        token,
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
        priceRange,
        setPriceRange,
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
        isContactModalOpen,
        setIsContactModalOpen,
        lastOrder,
        setLastOrder,
        promoCode,
        setPromoCode,
        appliedPromo,
        promoError,
        applyPromoCode,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartSubtotal,
        discountAmount,
        deliveryFee,
        cartGrandTotal,
        totalCartCount,
        openProductDetail,
        toast,
        showToast,
        API_BASE_URL
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
