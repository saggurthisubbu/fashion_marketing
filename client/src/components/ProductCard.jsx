import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const ProductCard = React.memo(({ product, priority = false }) => {
  const { addToCart, toggleWishlist, isInWishlist, openProductDetail } = useShop();
  const [isHovered, setIsHovered] = useState(false);

  const isSaved = isInWishlist(product.id || product._id);
  const isOutOfStock = (product.stockQuantity !== undefined ? product.stockQuantity : 25) <= 0
    || product.inStock === false;

  const rawFront = product.images?.front || product.image || product.images?.primary || '';
  const rawBack  = product.images?.back || '';
  const frontImage = resolveImageUrl(rawFront);
  const backImage  = rawBack ? resolveImageUrl(rawBack) : frontImage;
  const hasBackImage = Boolean(rawBack && rawBack !== rawFront);

  // Available Sizes
  const sizesList = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : typeof product.sizes === 'string' && product.sizes.trim()
    ? product.sizes.split(',').map(s => s.trim()).filter(Boolean)
    : ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div
      onClick={() => openProductDetail(product)}
      onMouseEnter={() => {
        if (hasBackImage && !isHovered) setIsHovered(true);
      }}
      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative h-full w-full select-none"
    >
      {/* ── IMAGE (COMPLETELY CLEAN WITHOUT ANY OVERLAYS) ─────────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 shrink-0">

        {/* Front */}
        <img
          src={frontImage}
          alt={product.name || 'Product'}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
          }}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            hasBackImage
              ? 'group-hover:opacity-0 group-hover:scale-105'
              : 'group-hover:scale-105'
          }`}
        />

        {/* Back (hover reveal - loaded on-demand on desktop hover) */}
        {hasBackImage && isHovered && (
          <img
            src={backImage}
            alt={`${product.name} Back`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = frontImage || DEFAULT_PLACEHOLDER_IMAGE;
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

      </div>

      {/* ── CONTENT (ALL LABELS & ACTIONS BELOW IMAGE ONLY) ────────────── */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between min-w-0">

        {/* Product name container - fixed uniform height prevents layout shift */}
        <div className="h-9 sm:h-10 flex items-start overflow-hidden">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 font-heading leading-snug break-words">
            {product.name}
          </h3>
        </div>

        {/* Price + Actions pinned to bottom */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 pt-2 border-t border-slate-100 mt-auto shrink-0 w-full">
          <span className="text-sm sm:text-lg font-black text-slate-900 font-heading shrink-0">
            ₹{product.price}
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="p-1 sm:p-1.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-slate-700 hover:text-rose-500 transition-colors flex items-center justify-center h-8 w-8 sm:h-[34px] sm:w-[34px] shrink-0 cursor-pointer"
              title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
              aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <span className={`text-xs sm:text-sm leading-none ${isSaved ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                {isSaved ? '♥' : '♡'}
              </span>
            </button>

            <button
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                const defaultSize = sizesList[0] || 'M';
                addToCart(product, defaultSize);
              }}
              className={`px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center shrink-0 h-8 sm:h-[34px] whitespace-nowrap cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-black text-white active:scale-95'
              }`}
            >
              {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
});

export default ProductCard;
