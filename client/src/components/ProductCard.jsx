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

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* ── IMAGE (COMPLETELY CLEAN WITHOUT ANY OVERLAYS) ─────────────── */}
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

      </div>

      {/* ── CONTENT (ALL LABELS & ACTIONS BELOW IMAGE ONLY) ────────────── */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">

        <div>
          {/* Product name */}
          <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 font-heading leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Price + Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <span className="text-base sm:text-lg font-black text-slate-900 font-heading">
            ₹{product.price}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="p-1.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-slate-700 hover:text-rose-500 transition-colors flex items-center justify-center !min-h-[34px] !min-w-[34px] cursor-pointer"
              title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <span className={`text-sm leading-none ${isSaved ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
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
              className={`py-1.5 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex-shrink-0 !min-h-[34px] cursor-pointer ${
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
};

export default ProductCard;
