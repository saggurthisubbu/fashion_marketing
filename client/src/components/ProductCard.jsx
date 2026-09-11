import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, openProductDetail } = useShop();

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

  // Discount percentage if original price is higher
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
  const discountText = product.discount || (hasDiscount
    ? `${Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}% OFF`
    : null);

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 hover:border-black shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
    >
      {/* ── IMAGE CONTAINER (EQUAL 3/4 ASPECT RATIO ACROSS ALL CARDS) ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 flex-shrink-0">
        
        {/* Front Image */}
        <img
          src={frontImage}
          alt={product.name || 'Product'}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
          }}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            hasBackImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
          }`}
        />

        {/* Back Image (Hover Reveal) */}
        {hasBackImage && (
          <img
            src={backImage}
            alt={`${product.name} Back`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = frontImage || DEFAULT_PLACEHOLDER_IMAGE;
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* Top-Left Badge (Discount / Express / Stock) */}
        {discountText ? (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
            {discountText}
          </span>
        ) : isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-neutral-900/90 text-neutral-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
            Sold Out
          </span>
        ) : null}

        {/* Top-Right Floating Wishlist Icon (Never Collides or Overflows) */}
        <button
          type="button"
          aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span className={`text-sm leading-none transition-colors ${isSaved ? 'text-rose-600 font-bold' : 'text-neutral-700'}`}>
            {isSaved ? '♥' : '♡'}
          </span>
        </button>
      </div>

      {/* ── CARD CONTENT (GUARANTEED EQUAL HEIGHT & CLEAN ALIGNMENT) ── */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        
        {/* Category & Title */}
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider truncate">
            {product.subcategory || product.category || "Men's Apparel"}
          </div>

          <h3 className="text-xs sm:text-sm font-black text-neutral-950 line-clamp-2 h-8 sm:h-9 leading-snug tracking-tight group-hover:text-neutral-700 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Pricing Area */}
        <div className="pt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-black text-neutral-950 tracking-tight">
            ₹{product.price}
          </span>
          {hasDiscount && (
            <span className="text-[11px] font-medium text-neutral-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Full-Width Add To Bag Button (No Overflow, Clean Luxury Black/White) */}
        <div className="pt-1.5 mt-auto">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              const defaultSize = sizesList[0] || 'M';
              addToCart(product, defaultSize);
            }}
            className={`w-full py-2 sm:py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 select-none ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                : 'bg-black text-white hover:bg-neutral-800 shadow-xs'
            }`}
          >
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
