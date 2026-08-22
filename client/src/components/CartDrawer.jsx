import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    discountAmount,
    deliveryFee,
    cartGrandTotal,
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    applyPromoCode,
    setIsCheckoutOpen
  } = useShop();

  if (!isCartOpen) return null;

  // Filter out any corrupted/null cart entries that could prevent rendering
  const safeCart = cart.filter(
    (item) => item && item.id && item.name && typeof item.price === 'number'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        
        {/* SLIDE OVER DRAWER */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* HEADER */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛍️</span>
              <h2 className="text-lg font-black text-slate-900 font-heading">
                Shopping Bag ({safeCart.reduce((acc, item) => acc + item.quantity, 0)})
              </h2>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>

          {/* ITEM LIST OR EMPTY STATE */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {safeCart.length > 0 ? (
              safeCart.map((item, idx) => (
                <div
                  key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
                  className="glass-card p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4 relative group"
                >
                  {/* THUMBNAIL */}
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

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-heading">
                      {item.name}
                    </h4>
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                      <span>Size: <strong className="text-slate-800">{item.selectedSize || 'M'}</strong></span>
                      {item.selectedColor && item.selectedColor !== 'Standard' && (
                        <span>• Color: <strong className="text-slate-800">{item.selectedColor}</strong></span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-blue-600">
                      ₹{item.price} <span className="text-[10px] text-slate-400 font-normal">x {item.quantity}</span>
                    </div>

                    {/* QUANTITY MODIFIERS */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, -1)}
                          className="w-6 h-6 rounded bg-white text-slate-800 font-bold text-xs hover:bg-slate-200 flex items-center justify-center shadow-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, 1)}
                          className="w-6 h-6 rounded bg-white text-slate-800 font-bold text-xs hover:bg-slate-200 flex items-center justify-center shadow-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right font-black text-sm text-slate-900 font-heading">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                  🛍️
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Your Bag Is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Add items from the Vijayawada catalog to enjoy 60-minute express delivery!
                </p>
              </div>
            )}
          </div>

          {/* FOOTER: PROMO & CHECKOUT BREAKDOWN */}
          {safeCart.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              
              {/* PROMO COUPON SYSTEM */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Promo Code</span>
                  <span className="text-[10px] text-blue-600 font-bold">Try: QUICK60 | FIRSTFIT</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code (e.g. QUICK60)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => applyPromoCode()}
                    className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <div className="text-xs text-emerald-600 font-bold flex items-center justify-between bg-emerald-50 p-2 rounded-lg">
                    <span>✓ Applied {appliedPromo.code}</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                {promoError && (
                  <div className="text-xs text-rose-600 font-medium">
                    {promoError}
                  </div>
                )}
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{cartSubtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>60-Min Express Delivery</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE (Above ₹999)</span>
                  ) : (
                    <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                  )}
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200 font-heading">
                  <span>Grand Total</span>
                  <span className="text-blue-600">₹{cartGrandTotal}</span>
                </div>
              </div>

              {/* PROCEED TO CHECKOUT BUTTON */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 transition-all btn-shimmer"
              >
                <span>Proceed to Checkout</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
