import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { formatSingleProductWhatsApp } from '../utils/whatsapp';

export const ProductDetailModal = () => {
  const { selectedProduct, isDetailModalOpen, setIsDetailModalOpen, addToCart } = useShop();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');

  // Zoom state for desktop hover
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Touch swipe state for mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Compute available 4-angle views
  const angleViews = selectedProduct ? [
    { key: 'front', label: 'Front View', badge: 'FRONT', url: selectedProduct.images?.front || selectedProduct.image },
    { key: 'back', label: 'Back View', badge: 'BACK', url: selectedProduct.images?.back },
    { key: 'left', label: 'Left Side View', badge: 'LEFT', url: selectedProduct.images?.left },
    { key: 'right', label: 'Right Side View', badge: 'RIGHT', url: selectedProduct.images?.right }
  ].filter(v => Boolean(v.url)) : [];

  // Reset state when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setCurrentIndex(0);
      setSelectedSize(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes[0] : 'M');
      setSelectedColor(selectedProduct.colors && selectedProduct.colors.length > 0 ? (selectedProduct.colors[0].name || '') : '');
      setIsZoomed(false);
    }
  }, [selectedProduct]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isDetailModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDetailModalOpen(false);
      } else if (e.key === 'ArrowRight' && angleViews.length > 1) {
        setCurrentIndex((prev) => (prev === angleViews.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft' && angleViews.length > 1) {
        setCurrentIndex((prev) => (prev === 0 ? angleViews.length - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen, angleViews.length, setIsDetailModalOpen]);

  if (!isDetailModalOpen || !selectedProduct) return null;

  const currentAngle = angleViews[currentIndex] || angleViews[0] || {
    url: selectedProduct.image,
    label: 'Front View',
    badge: 'FRONT'
  };

  const handlePrev = () => {
    if (angleViews.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? angleViews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (angleViews.length <= 1) return;
    setCurrentIndex((prev) => (prev === angleViews.length - 1 ? 0 : prev + 1));
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40; // minimum swipe distance

    if (Math.abs(diff) > threshold && angleViews.length > 1) {
      if (diff > 0) {
        // Swiped Left -> Next Image
        handleNext();
      } else {
        // Swiped Right -> Previous Image
        handlePrev();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Desktop Hover Zoom Handlers
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleWhatsAppInstant = () => {
    const url = formatSingleProductWhatsApp(selectedProduct, selectedSize, selectedColor);
    window.open(url, '_blank');
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, selectedSize, selectedColor);
  };

  const stock = selectedProduct.stockQuantity !== undefined ? selectedProduct.stockQuantity : 25;
  const isOutOfStock = stock <= 0 || selectedProduct.inStock === false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsDetailModalOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 max-h-[94vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-black text-white font-bold flex items-center justify-center transition-colors shadow-md !min-h-[36px]"
          title="Close Modal (Esc)"
        >
          ✕
        </button>

        {/* LEFT COLUMN: 4-ANGLE INTERACTIVE GALLERY (COL-SPAN-7) */}
        <div className="md:col-span-7 p-4 sm:p-6 bg-slate-50 flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-slate-200">
          
          {/* MAIN IMAGE DISPLAY WITH ARROWS, ZOOM & MOBILE SWIPE */}
          <div
            className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200 select-none group cursor-crosshair"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {/* ACTIVE ANGLE IMAGE WITH HOVER ZOOM EFFECT */}
            <img
              src={currentAngle.url}
              alt={`${selectedProduct.name} - ${currentAngle.label}`}
              className="w-full h-full object-cover transition-transform duration-200 ease-out pointer-events-none"
              style={
                isZoomed
                  ? {
                      transform: 'scale(2.2)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                    }
                  : { transform: 'scale(1)' }
              }
            />

            {/* ANGLE VIEW BADGE */}
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 z-20 shadow-xs">
              {currentAngle.badge} • {currentAngle.label}
            </div>

            {/* ZOOM HINT OVERLAY ON DESKTOP */}
            <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1.5 bg-white/80 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 opacity-80 group-hover:opacity-100 transition-opacity z-20">
              <span>🔍</span>
              <span>Hover to Zoom</span>
            </div>

            {/* PREV ARROW */}
            {angleViews.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 font-black text-base !min-h-[40px]"
                title="Previous Angle"
              >
                ‹
              </button>
            )}

            {/* NEXT ARROW */}
            {angleViews.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 font-black text-base !min-h-[40px]"
                title="Next Angle"
              >
                ›
              </button>
            )}

            {/* MOBILE SWIPE HINT DOTS */}
            {angleViews.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                {angleViews.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentIndex === idx ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                    }`}
                  ></span>
                ))}
              </div>
            )}
          </div>

          {/* 4-ANGLE THUMBNAIL ROW BELOW MAIN IMAGE */}
          {angleViews.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 px-1">
                <span>Select Angle View ({angleViews.length} Available)</span>
                <span className="text-slate-900 font-bold">{currentIndex + 1} / {angleViews.length}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {angleViews.map((angle, idx) => {
                  const isActive = currentIndex === idx;
                  return (
                    <button
                      key={angle.key}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white flex flex-col justify-between group shadow-xs ${
                        isActive
                          ? 'border-slate-900 ring-2 ring-slate-900/20 scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={angle.url}
                        alt={angle.label}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className={`absolute bottom-1 inset-x-1 py-0.5 rounded text-center text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-black/60 text-white backdrop-blur-xs'
                      }`}>
                        {angle.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PRODUCT DETAILS & ACTIONS (COL-SPAN-5) */}
        <div className="md:col-span-5 p-5 sm:p-7 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            
            {/* CATEGORY & BOUTIQUE */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                {selectedProduct.subcategory || "Men's Apparel"}
              </span>
              <span className="text-xs font-bold text-slate-500 truncate">
                {selectedProduct.boutique || 'QuickFit Central, Vijayawada'}
              </span>
            </div>

            {/* TITLE */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading leading-tight uppercase">
              {selectedProduct.name}
            </h2>

            {/* PRICING & STOCK */}
            <div className="flex items-baseline gap-3 py-3 border-y border-slate-100">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                ₹{selectedProduct.price}
              </div>
              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <div className="text-xs sm:text-sm text-slate-400 line-through">
                  ₹{selectedProduct.originalPrice}
                </div>
              )}
              {selectedProduct.discount && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase">
                  {selectedProduct.discount}
                </span>
              )}
              <div className="ml-auto">
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-bold uppercase">
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                    {stock} in Stock
                  </span>
                )}
              </div>
            </div>

            {/* SIZES */}
            {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
                  <span>Select Size: <strong className="text-blue-600">{selectedSize}</strong></span>
                  <span className="text-[10px] text-slate-400 font-semibold lowercase">standard relaxed fit</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase border transition-all !min-h-[40px] ${
                        selectedSize === sz
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            {selectedProduct.description && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block">
                  Product Details
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>
            )}

          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 !min-h-[48px] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-black text-white active:scale-98'
              }`}
            >
              <span>🛍️</span>
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>

            <button
              onClick={handleWhatsAppInstant}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 !min-h-[44px] active:scale-98"
            >
              <span>💬</span>
              <span>Direct WhatsApp Order (+91 7396629821)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
