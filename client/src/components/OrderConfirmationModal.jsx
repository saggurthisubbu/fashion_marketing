import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp } from '../utils/whatsapp';

export const OrderConfirmationModal = () => {
  const { lastOrder, isOrderConfirmedOpen, setIsOrderConfirmedOpen } = useShop();

  // Live 60-minute countdown timer in seconds (3600 seconds)
  const [timeLeft, setTimeLeft] = useState(3540); // Starts at 59 mins

  useEffect(() => {
    if (!isOrderConfirmedOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOrderConfirmedOpen]);

  if (!isOrderConfirmedOpen || !lastOrder) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleWhatsAppResend = () => {
    const url = formatFullOrderWhatsApp(lastOrder);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 text-center max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-200 space-y-5 my-auto">
        
        {/* BADGE */}
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
            Thank you, <strong className="text-slate-900 font-bold">{lastOrder.customer?.fullName || lastOrder.customer?.name || 'Valued Customer'}</strong>! Your order is placed and ready for dispatch.
          </p>
        </div>

        {/* ESTIMATED ARRIVAL */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Estimated Delivery
          </div>
          <div className="text-3xl font-black font-heading text-white tracking-wider">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-300">
            Dispatching to <strong>{lastOrder.customer?.area || lastOrder.customer?.address || 'Vijayawada'}</strong>
          </div>
        </div>

        {/* GPS ATTACHED CONFIRMATION */}
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

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleWhatsAppResend}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-2 uppercase tracking-wider !min-h-[44px]"
          >
            <span>💬 Open Order on WhatsApp</span>
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
