import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const WishlistModal = () => {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart } = useShop();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        
        {/* DRAWER */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-slate-100">
          
          {/* HEADER */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-black text-sm text-white">
                ❤️
              </div>
              <div>
                <h2 className="text-lg font-black font-heading text-white">Saved Wishlist ({wishlist.length})</h2>
                <p className="text-xs text-slate-300">Your favorite Vijayawada outfits</p>
              </div>
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* LIST OR EMPTY STATE */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlist.length > 0 ? (
              wishlist.map((item) => (
                <div
                  key={item.id || item._id}
                  className="glass-card p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4 relative group"
                >
                  <img
                    src={resolveImageUrl(item.image || item.images?.front)}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                    className="w-20 h-24 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{item.category}</span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-heading">
                      {item.name}
                    </h4>
                    <div className="text-xs font-bold text-slate-900">
                      ₹{item.price} {item.originalPrice && <span className="text-slate-400 text-[10px] line-through">₹{item.originalPrice}</span>}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        + Add to Bag
                      </button>

                      <button
                        onClick={() => toggleWishlist(item)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ❤️
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Your Wishlist Is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Heart any item in the catalog to save it for quick express ordering later!
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
