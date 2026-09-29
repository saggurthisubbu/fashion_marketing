import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE, handleImageError } from '../config/api';
import { Heart } from 'lucide-react';

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
      className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/90 hover:border-slate-400 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative h-full w-full select-none"
    >
      {/* ── IMAGE CONTAINER (Consistently 3:4 portrait, edge-to-edge) ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 shrink-0">
        
        {/* Wishlist Heart Icon - Clean, small, properly aligned top-right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center border border-black/5 shadow-xs hover:bg-white active:scale-90 transition-transform cursor-pointer"
          title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
          aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isSaved
                ? 'fill-rose-500 stroke-rose-500'
                : 'stroke-slate-700 hover:stroke-black fill-transparent'
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Front Image */}
        <img
          src={frontImage}
          alt={product.name || 'Product'}
          loading={priority ? 'eager' : 'lazy'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          decoding="async"
          onError={(e) => handleImageError(e, DEFAULT_PLACEHOLDER_IMAGE)}
          className={`w-full h-full object-cover object-top product-image-hd transition-all duration-500 ease-out ${
            hasBackImage
              ? 'group-hover:opacity-0 group-hover:scale-105'
              : 'group-hover:scale-105'
          }`}
        />

        {/* Back Image (Desktop Hover) */}
        {hasBackImage && isHovered && (
          <img
            src={backImage}
            alt={`${product.name} Back`}
            loading="lazy"
            decoding="async"
            onError={(e) => handleImageError(e, frontImage || DEFAULT_PLACEHOLDER_IMAGE)}
            className="absolute inset-0 w-full h-full object-cover object-top product-image-hd opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}
      </div>

      {/* ── CONTENT (Readable 2-line title, clear price, pinned bottom button) ── */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between min-w-0">
        <div>
          {/* Subcategory micro-label */}
          {product.subcategory && (
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 line-clamp-1">
              {product.subcategory}
            </p>
          )}

          {/* Product name container - uniform 2-line height ensures equal alignment across all cards */}
          <div className="min-h-[2.25rem] sm:min-h-[2.5rem] flex items-start overflow-hidden">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 font-heading leading-tight break-words group-hover:text-slate-700 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Price Container */}
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-slate-900 font-heading shrink-0">
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Add To Bag Button - Full width, easy to tap, all aligned at same bottom position */}
        <div className="pt-2 sm:pt-2.5 mt-auto w-full">
          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              const defaultSize = sizesList[0] || 'M';
              addToCart(product, defaultSize);
            }}
            className={`w-full h-8 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer select-none ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-black active:scale-[0.98] text-white shadow-xs'
            }`}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
