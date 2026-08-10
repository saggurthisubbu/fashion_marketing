import React from 'react';
import { useShop } from '../context/ShopContext';
import { formatSingleProductWhatsApp } from '../utils/whatsapp';
import { resolveImageUrl } from '../config/api';

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, openProductDetail } = useShop();

  const isSaved = isInWishlist(product.id || product._id);
  const stock = product.stockQuantity !== undefined ? product.stockQuantity : 25;
  const isOutOfStock = stock <= 0 || product.inStock === false;

  const rawFront = product.images?.front || product.image || product.images?.primary || '';
  const rawBack = product.images?.back || '';
  const frontImage = resolveImageUrl(rawFront);
  const backImage = rawBack ? resolveImageUrl(rawBack) : frontImage;
  const hasBackImage = Boolean(rawBack && rawBack !== rawFront);

  // Available angles count
  const angleCount = product.images
    ? [product.images.front, product.images.back, product.images.left, product.images.right].filter(Boolean).length
    : (product.gallery ? product.gallery.length : 1);

  const handleWhatsAppOrder = (e) => {
    e.stopPropagation();
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    const defaultColor = product.colors && product.colors.length > 0 ? (product.colors[0].name || 'Standard') : 'Standard';
    const url = formatSingleProductWhatsApp(product, defaultSize, defaultColor);
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* IMAGE CONTAINER WITH 3:4 ASPECT RATIO AND FRONT/BACK HOVER FLIP */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        
        {/* FRONT VIEW (DEFAULT) */}
        <img
          src={frontImage}
          alt={product.name || "Product Image"}
          loading="lazy"
          onError={(e) => {
            console.warn('[IMAGE ERROR] Failed to load image on ProductCard for:', product.name, '-> fallback to placeholder');
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder-product.jpg';
          }}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            hasBackImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
          }`}
        />

        {/* BACK VIEW (HOVER REVEAL) */}
        {hasBackImage && (
          <img
            src={backImage}
            alt={`${product.name} Back View`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = frontImage || '/placeholder-product.jpg';
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* ANGLE VIEW INDICATOR BADGE */}
        {angleCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20 z-10">
            <span>📷</span>
            <span>{angleCount} Views</span>
          </div>
        )}

        {/* DISCOUNT BADGE */}
        {product.discount && (
          <div className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[9px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-xs uppercase tracking-wider z-10">
            {product.discount}
          </div>
        )}

        {/* WISHLIST BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 shadow-xs hover:bg-white transition-transform active:scale-90 !min-h-[36px] !min-w-[36px] flex items-center justify-center z-10"
          title="Save to Wishlist"
        >
          <span className={`text-sm ${isSaved ? 'text-rose-500 font-bold' : 'text-slate-600'}`}>
            {isSaved ? '♥' : '♡'}
          </span>
        </button>

        {/* STOCK STATUS PILL */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-sm bg-slate-900/90 text-white text-[9px] font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          ) : stock <= 5 ? (
            <span className="px-2 py-0.5 rounded-sm bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider">
              Only {stock} Left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-sm bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        
        <div>
          {/* CATEGORY */}
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {product.subcategory || product.category || "Men's Apparel"}
          </div>

          {/* TITLE */}
          <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1 font-heading group-hover:text-blue-600 transition-colors uppercase mt-0.5">
            {product.name}
          </h3>

          {/* SIZES */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1 mt-1 overflow-hidden">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Sizes:</span>
              <span className="text-[9px] sm:text-[10px] text-slate-700 font-bold truncate">
                {product.sizes.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* PRICING & ACTIONS */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900 font-heading">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
                addToCart(product, defaultSize);
              }}
              className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center !min-h-[38px] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-black text-white shadow-xs'
              }`}
            >
              Add to Bag
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-xs !min-h-[38px]"
              title="Order on WhatsApp"
            >
              <span>💬</span>
              <span className="hidden xs:inline">WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
