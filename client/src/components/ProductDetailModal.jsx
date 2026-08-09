import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatSingleProductWhatsApp } from '../utils/whatsapp';

export const ProductDetailModal = () => {
  const { selectedProduct, isDetailModalOpen, setIsDetailModalOpen, addToCart } = useShop();

  const [activeImage, setActiveImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.image);
      setSelectedSize(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes[0] : 'M');
      setSelectedColor(selectedProduct.colors && selectedProduct.colors.length > 0 ? (selectedProduct.colors[0].name || '') : '');
    }
  }, [selectedProduct]);

  if (!isDetailModalOpen || !selectedProduct) return null;

  const galleryImages = selectedProduct.gallery && selectedProduct.gallery.length > 0
    ? selectedProduct.gallery
    : [selectedProduct.image];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsDetailModalOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL DIALOG */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
        >
          ✕
        </button>

        {/* LEFT COLUMN: PRODUCT IMAGE */}
        <div className="p-4 sm:p-6 bg-slate-50 flex flex-col justify-between space-y-4">
          
          {/* MAIN PREVIEW IMAGE */}
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white shadow-inner border border-slate-200">
            <img
              src={activeImage || selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {selectedProduct.subcategory || selectedProduct.category}
            </div>
          </div>

          {/* MULTI-ANGLE THUMBNAILS IF GALLERY EXISTS */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === imgUrl ? 'border-slate-900 shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Angle ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            
            {/* CATEGORY */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-wider">
                {selectedProduct.subcategory || "Men's Apparel"}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedProduct.boutique || 'QuickFit Central, Vijayawada'}
              </span>
            </div>

            {/* TITLE */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading leading-tight uppercase">
              {selectedProduct.name}
            </h2>

            {/* PRICING & STOCK */}
            <div className="flex items-baseline gap-3 py-2 border-y border-slate-100">
              <div className="text-3xl font-black text-slate-900 font-heading">
                ₹{selectedProduct.price}
              </div>
              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <div className="text-sm text-slate-400 line-through">
                  ₹{selectedProduct.originalPrice}
                </div>
              )}
              {selectedProduct.discount && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase">
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
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Select Size: <strong className="text-blue-600">{selectedSize}</strong>
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all !min-h-[40px] ${
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
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>
            )}

          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 !min-h-[48px] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              <span>🛍️</span>
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>

            <button
              onClick={handleWhatsAppInstant}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 !min-h-[44px]"
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
