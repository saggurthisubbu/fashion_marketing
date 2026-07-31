import React from 'react';
import { useShop } from '../context/ShopContext';
import { formatSingleProductWhatsApp } from '../utils/whatsapp';

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, openProductDetail } = useShop();

  const isSaved = isInWishlist(product.id);

  const handleWhatsAppOrder = (e) => {
    e.stopPropagation();
    const defaultSize = product.sizes ? product.sizes[0] : 'M';
    const defaultColor = product.colors ? product.colors[0].name : '';
    const url = formatSingleProductWhatsApp(product, defaultSize, defaultColor);
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group glass-card rounded-3xl overflow-hidden border border-slate-200/80 hover:border-blue-400/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* IMAGE CONTAINER WITH HOVER ZOOM */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        {/* DISCOUNT BADGE */}
        {product.discount && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
            {product.discount}
          </div>
        )}

        {/* EXPRESS 60 MIN BADGE */}
        <div className="absolute bottom-3 left-3 glass-panel px-2.5 py-1 rounded-full border border-white/60 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
            {product.expressDelivery}
          </span>
        </div>

        {/* WISHLIST BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md border border-white/80 shadow-md hover:bg-white transition-transform active:scale-95"
          title="Save to Wishlist"
        >
          <svg className="w-4 h-4" fill={isSaved ? '#e11d48' : 'none'} viewBox="0 0 24 24" stroke={isSaved ? '#e11d48' : '#475569'}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* QUICK VIEW OVERLAY TRIGGER */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
            Quick View 👁️
          </span>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* BOUTIQUE & CATEGORY TAG */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span className="text-blue-600 font-bold">{product.category} • {product.subcategory}</span>
            <span className="truncate max-w-[120px]" title={product.boutique}>{product.boutique.split(',')[0]}</span>
          </div>

          {/* TITLE */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 font-heading group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* RATING STARS */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex text-amber-400">
              {'★'.repeat(Math.floor(product.rating))}
            </div>
            <span className="text-xs font-bold text-slate-800">{product.rating}</span>
            <span className="text-[11px] text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* PRICING & ACTION BUTTONS */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-heading">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              IN STOCK
            </span>
          </div>

          {/* ACTION BUTTONS (ADD TO BAG & WHATSAPP) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add to Bag</span>
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              title="Instant WhatsApp Order"
            >
              <span className="text-sm">💬</span>
              <span>WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
