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

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* ── IMAGE ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">

        {/* Front */}
        <img
          src={frontImage}
          alt={product.name || 'Product'}
          loading="lazy"
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

        {/* Back (hover reveal) */}
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

        {/* Wishlist / Heart button — top-right corner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs hover:bg-white transition-transform active:scale-90 !min-h-[36px] !min-w-[36px] flex items-center justify-center z-10"
          title="Save to Wishlist"
        >
          <span className={`text-sm ${isSaved ? 'text-rose-500 font-bold' : 'text-slate-600'}`}>
            {isSaved ? '♥' : '♡'}
          </span>
        </button>

      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 flex flex-col gap-2">

        {/* Product name */}
        <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 font-heading leading-snug">
          {product.name}
        </h3>

        {/* Price + Add to Bag */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span className="text-base sm:text-lg font-black text-slate-900 font-heading">
            ₹{product.price}
          </span>

          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              const defaultSize = product.sizes?.length > 0 ? product.sizes[0] : 'M';
              addToCart(product, defaultSize);
            }}
            className={`py-1.5 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex-shrink-0 !min-h-[34px] ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
