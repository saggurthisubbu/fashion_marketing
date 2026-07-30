import React, { createContext, useContext, useState, useEffect } from 'react';
import { productsData } from '../data/products';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // --- STATE MANAGEMENT ---
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState(6000);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderConfirmedOpen, setIsOrderConfirmedOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  // Last Generated Order
  const [lastOrder, setLastOrder] = useState(null);

  // Promo Coupon System
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discountPercent, discountFlat }
  const [promoError, setPromoError] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- CART FUNCTIONS ---
  const addToCart = (product, size = 'M', color = '') => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
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

  // Free delivery above ₹1999
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
        products: productsData,
        cart,
        wishlist,
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
        showToast
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
