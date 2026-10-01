import React from 'react';
import {
  Bell,
  CheckCircle,
  Package,
  User,
  Phone,
  CreditCard,
  Volume2,
  X
} from 'lucide-react';

export const UrgentOrderAlertModal = ({ orderAlert, onAccept, onDismiss }) => {
  if (!orderAlert) return null;

  const {
    orderId = 'New',
    customerName = 'Customer',
    customerPhone = '',
    totalAmount = '0',
    itemsCount = '1',
    paymentMethod = 'COD'
  } = orderAlert;

  const safeAmount = Number(String(totalAmount).replace(/[^0-9.]/g, '')) || 0;

  const handleAcceptClick = () => {
    console.log(`[FCM ORDER CLIENT] Accept Order clicked: #${orderId}`);
    if (typeof onAccept === 'function') {
      onAccept(orderId);
    }
  };

  const handleDismissClick = () => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Glow Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-zinc-950 border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.45)] text-white">
        
        {/* Urgent Pulsing Banner Top */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-6 py-4 flex items-center justify-between text-zinc-950 font-black">
          <div className="flex items-center gap-2.5 animate-pulse">
            <span className="p-1.5 rounded-xl bg-black text-amber-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </span>
            <span className="tracking-wider uppercase text-sm sm:text-base font-black">
              🔔 URGENT NEW ORDER RECEIVED
            </span>
          </div>

          <button
            onClick={handleDismissClick}
            className="p-1 rounded-lg hover:bg-black/20 text-zinc-900 transition-colors"
            title="Silence Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Order ID & Price Header */}
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Order ID</span>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                #{orderId}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Amount</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ₹{safeAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="w-4 h-4 text-amber-400" />
                <span>Customer</span>
              </div>
              <span className="font-bold text-white text-sm">{customerName}</span>
            </div>

            {customerPhone && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Phone</span>
                </div>
                <span className="font-bold text-white font-mono">{customerPhone}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Items</span>
                </div>
                <span className="font-black text-white">{itemsCount} item{itemsCount === '1' ? '' : 's'}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Payment</span>
                </div>
                <span className="font-black text-white">{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Sound notification pulse badge */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 text-[11px] font-semibold">
            <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Alert chime is repeating until you accept this order</span>
          </div>

          {/* Accept Order Action Button */}
          <button
            type="button"
            id="btn-urgent-accept-order"
            onClick={handleAcceptClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            <CheckCircle className="w-6 h-6 text-zinc-950" />
            <span>ACCEPT ORDER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
