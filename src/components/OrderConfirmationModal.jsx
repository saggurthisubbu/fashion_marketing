import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { formatFullOrderWhatsApp, formatMailtoNotification } from '../utils/whatsapp';

export const OrderConfirmationModal = () => {
  const { lastOrder, isOrderConfirmedOpen, setIsOrderConfirmedOpen, setIsTrackingOpen } = useShop();

  if (!isOrderConfirmedOpen || !lastOrder) return null;

  // Live 60-minute countdown timer in seconds (3600 seconds)
  const [timeLeft, setTimeLeft] = useState(3540); // Starts at 59 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleWhatsAppResend = () => {
    const url = formatFullOrderWhatsApp(lastOrder);
    window.open(url, '_blank');
  };

  const handleEmailResend = () => {
    const mailto = formatMailtoNotification(lastOrder);
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsOrderConfirmedOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-lg transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL DIALOG */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 text-center max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-100 space-y-6">
        
        {/* CELEBRATION BADGE */}
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto text-white text-3xl shadow-xl shadow-teal-500/30 animate-bounce">
          🎉
        </div>

        <div>
          <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
            ORDER CONFIRMED • VIJAYAWADA
          </span>
          <h2 className="text-3xl font-black text-slate-900 font-heading mt-2">
            Order #{lastOrder.orderId}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            Thank you, <strong className="text-slate-900 font-bold">{lastOrder.customer.fullName}</strong>! Your express order has been dispatched from local boutique.
          </p>
        </div>

        {/* LIVE 60-MINUTE COUNTDOWN TIMER */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
          
          <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">
            GUARANTEED EXPRESS DELIVERY TIMER
          </div>
          <div className="text-5xl font-black font-heading text-white tracking-widest my-2">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-300">
            Estimated Arrival at <strong>{lastOrder.customer.area || 'Vijayawada'}</strong> within 60 Minutes
          </div>
        </div>

        {/* ANIMATED RIDER PROGRESS TRACKER */}
        <div className="space-y-2 text-left bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
            Live Rider Status
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <div className="text-emerald-600 space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">✓</div>
              <div>Confirmed</div>
            </div>
            <div className="text-emerald-600 space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">✓</div>
              <div>Boutique Packing</div>
            </div>
            <div className="text-blue-600 space-y-1 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">🛵</div>
              <div>Rider En Route</div>
            </div>
            <div className="text-slate-400 space-y-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">🏡</div>
              <div>Doorstep Arrival</div>
            </div>
          </div>
        </div>

        {/* NOTIFICATION DETAILS */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left text-xs space-y-1">
          <div className="font-bold text-blue-900">Notifications Sent To:</div>
          <div className="text-blue-800">💬 WhatsApp: +91 7396629821</div>
          <div className="text-blue-800">📧 Email: saggurthisubbu9@gmail.com</div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              setIsOrderConfirmedOpen(false);
              setIsTrackingOpen(true);
            }}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>📍 Open Live Rider Map Demo</span>
          </button>

          <button
            onClick={handleWhatsAppResend}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>💬 Resend WhatsApp Order</span>
          </button>
        </div>

        <button
          onClick={() => setIsOrderConfirmedOpen(false)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Close & Continue Shopping
        </button>

      </div>

    </div>
  );
};
