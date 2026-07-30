import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { formatSingleProductWhatsApp } from '../utils/whatsapp';

export const ProductDetailModal = () => {
  const { selectedProduct, isDetailModalOpen, setIsDetailModalOpen, addToCart } = useShop();

  if (!isDetailModalOpen || !selectedProduct) return null;

  const [activeImage, setActiveImage] = useState(selectedProduct.image);
  const [selectedSize, setSelectedSize] = useState(selectedProduct.sizes ? selectedProduct.sizes[0] : 'M');
  const [selectedColor, setSelectedColor] = useState(selectedProduct.colors ? selectedProduct.colors[0].name : '');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsDetailModalOpen(false)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL DIALOG */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
        >
          ✕
        </button>

        {/* LEFT COLUMN: MULTI-ANGLE GALLERY */}
        <div className="p-6 bg-slate-50 flex flex-col justify-between space-y-4">
          
          {/* MAIN PREVIEW IMAGE */}
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white shadow-inner">
            <img
              src={activeImage}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 glass-panel px-3 py-1 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-wider">
              {selectedProduct.expressDelivery}
            </div>
          </div>

          {/* THUMBNAIL GALLERY */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === imgUrl ? 'border-blue-600 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            
            {/* BOUTIQUE BADGE & CATEGORY */}
            <div>
              <span className="text-xs font-extrabold uppercase text-blue-600 tracking-wider">
                {selectedProduct.category} • {selectedProduct.subcategory}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                {selectedProduct.name}
              </h2>
              <div className="text-xs text-slate-500 font-medium mt-1">
                Boutique: <strong className="text-slate-800 font-semibold">{selectedProduct.boutique}</strong>
              </div>
            </div>

            {/* PRICING */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 font-heading">
                ₹{selectedProduct.price}
              </span>
              {selectedProduct.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{selectedProduct.originalPrice}
                </span>
              )}
              {selectedProduct.discount && (
                <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1 rounded-md">
                  {selectedProduct.discount}
                </span>
              )}
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* SIZE SELECTOR */}
            {selectedProduct.sizes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Select Size:</span>
                  <span className="text-blue-600 cursor-pointer hover:underline">Rider Waits For Try-On!</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {selectedProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[44px] h-11 px-3.5 rounded-xl font-bold text-xs border transition-all ${
                        selectedSize === sz
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COLOR SELECTOR */}
            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Color Option: <strong className="text-blue-600">{selectedColor}</strong>
                </span>
                <div className="flex items-center gap-3">
                  {selectedProduct.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        selectedColor === c.name ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE DISPATCH COUNTER */}
            <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div className="text-xs">
                <div className="font-bold text-orange-900">Vijayawada 60-Minute Express</div>
                <div className="text-orange-700">Order now for dispatch in <strong>15 Mins</strong> from store.</div>
              </div>
            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Add To Shopping Bag</span>
            </button>

            <button
              onClick={handleWhatsAppInstant}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <span className="text-lg">💬</span>
              <span>Instant Order via WhatsApp (+91 7396629821)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
