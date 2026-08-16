import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp, getPublicProductImageUrl } from '../utils/whatsapp';
import { resolveImageUrl } from '../config/api';

const DEFAULT_PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

export const OrderConfirmationModal = () => {
  const { lastOrder, isOrderConfirmedOpen, setIsOrderConfirmedOpen } = useShop();

  // Live 60-minute countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState(3540); // Starts at 59 mins

  useEffect(() => {
    if (!isOrderConfirmedOpen) {
      setTimeLeft(3540); // Reset timer when modal closes
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOrderConfirmedOpen]);

  if (!isOrderConfirmedOpen || !lastOrder) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Build the enriched lastOrder payload to pass into the WhatsApp formatter
  const enrichedOrder = {
    ...lastOrder,
    customer: {
      ...(lastOrder.customer || {}),
      fullName:
        lastOrder.customer?.fullName ||
        lastOrder.customer?.name ||
        'Valued Customer'
    },
    items: (lastOrder.items || []).map((item) => ({
      ...item,
      // Ensure image is properly present from cart / order snapshot
      image:
        item.images?.front ||
        item.image ||
        item.imageUrl ||
        ''
    }))
  };

  const handleWhatsAppResend = () => {
    const url = formatFullOrderWhatsApp(enrichedOrder);
    window.open(url, '_blank');
  };

  const orderItems = enrichedOrder.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 text-center max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-200 space-y-5 my-auto">

        {/* SUCCESS BADGE */}
        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider">
            ORDER CONFIRMED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-2">
            Order #{lastOrder.orderId}
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
            Thank you,{' '}
            <strong className="text-slate-900 font-bold">
              {lastOrder.customer?.fullName || lastOrder.customer?.name || 'Valued Customer'}
            </strong>
            ! Your order is placed and ready for dispatch.
          </p>
        </div>

        {/* ESTIMATED ARRIVAL TIMER */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Estimated Delivery
          </div>
          <div className="text-3xl font-black font-heading text-white tracking-wider">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-300">
            Dispatching to{' '}
            <strong>{lastOrder.customer?.area || lastOrder.customer?.address || 'Vijayawada'}</strong>
          </div>
        </div>

        {/* PRODUCT ORDER SUMMARY WITH IMAGES */}
        {orderItems.length > 0 && (
          <div className="text-left space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              📦 Order Summary ({orderItems.length} item{orderItems.length !== 1 ? 's' : ''})
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {orderItems.map((item, idx) => {
                const resolvedImg = resolveImageUrl(item.images?.front || item.image || '');
                const fallbackImg = DEFAULT_PRODUCT_PLACEHOLDER;
                const qty = item.quantity || item.qty || 1;
                const lineTotal = (item.price || 0) * qty;
                const color = item.selectedColor || item.color;

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white">
                    {/* Product Image */}
                    <div className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                      <img
                        src={resolvedImg}
                        alt={`${item.name} — Size: ${item.selectedSize || item.size || 'M'}`}
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImg;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Size: {item.selectedSize || item.size || 'M'}
                        {color ? ` • Color: ${color}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">Qty: {qty}</div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-slate-900 text-xs">₹{lineTotal}</div>
                      {qty > 1 && (
                        <div className="text-[10px] text-slate-400">₹{item.price} each</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Total Row */}
              <div className="flex justify-between items-center p-3 bg-slate-50">
                <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  Total Paid
                </span>
                <span className="font-black text-slate-900 text-sm">
                  ₹{lastOrder.totalAmount || lastOrder.grandTotal}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GPS LOCATION LINK */}
        {lastOrder.locationLink && lastOrder.locationLink !== 'Not provided' && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
              <span>📍</span>
              <span>GPS Location Attached:</span>
            </div>
            <a
              href={lastOrder.locationLink}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 underline text-[11px] break-all block"
            >
              {lastOrder.locationLink}
            </a>
          </div>
        )}

        {/* WHATSAPP NOTICE */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs">
          <div className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5 mb-1">
            <span>💬</span>
            <span>WhatsApp Confirmation</span>
          </div>
          <p className="text-emerald-700 leading-relaxed">
            Your order details including <strong>product photos</strong> (tap the image link to view), sizes, pricing, and delivery address are ready. Tap below to send via WhatsApp.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleWhatsAppResend}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-2 uppercase tracking-wider !min-h-[44px]"
          >
            <span>💬 Send Order Summary with Photos on WhatsApp</span>
          </button>

          <button
            onClick={() => setIsOrderConfirmedOpen(false)}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors !min-h-[40px]"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
