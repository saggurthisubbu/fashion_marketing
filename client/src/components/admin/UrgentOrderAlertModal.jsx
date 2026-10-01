import React from 'react';
import {
  Bell,
  CheckCircle,
  Eye,
  Package,
  User,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  Volume2,
  X
} from 'lucide-react';

export const UrgentOrderAlertModal = ({ orderAlert, onAccept, onView, onDismiss }) => {
  if (!orderAlert) return null;

  const {
    orderId = 'New',
    customerName = 'Customer',
    customerPhone = '',
    customerAddress = '',
    items = [],
    itemsCount = '1',
    totalAmount = '0',
    paymentMethod = 'COD',
    orderDate
  } = orderAlert;

  // Safely parse items if delivered as JSON string or raw array
  let parsedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    parsedItems = items;
  } else if (typeof items === 'string' && items.trim()) {
    try {
      parsedItems = JSON.parse(items);
    } catch {
      parsedItems = [];
    }
  } else if (orderAlert.payload?.data?.items) {
    try {
      const raw = orderAlert.payload.data.items;
      parsedItems = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      parsedItems = [];
    }
  }

  const safeAmount = Number(String(totalAmount).replace(/[^0-9.]/g, '')) || 0;

  const formattedTime = (() => {
    try {
      const d = orderDate ? new Date(orderDate) : new Date();
      if (isNaN(d.getTime())) return 'Just now';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Just now';
    }
  })();

  const handleAcceptClick = () => {
    console.log(`[FCM ORDER CLIENT] Accept Order clicked: ${orderId}`);
    if (typeof onAccept === 'function') {
      onAccept(orderId);
    }
  };

  const handleViewClick = () => {
    console.log(`[FCM ORDER CLIENT] View Order clicked: ${orderId}`);
    if (typeof onView === 'function') {
      onView(orderId);
    } else if (typeof onAccept === 'function') {
      onAccept(orderId);
    }
  };

  const handleDismissClick = () => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  return (
    <div
      id="urgent-order-alert-backdrop"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Outer Glow Card */}
      <div
        id="urgent-order-alert-card"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-950 border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] text-white max-h-[92vh] flex flex-col"
      >
        {/* Urgent Pulsing Banner Top */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-5 sm:px-6 py-3.5 flex items-center justify-between text-zinc-950 font-black shrink-0">
          <div className="flex items-center gap-2.5 animate-pulse">
            <span className="p-1.5 rounded-xl bg-black text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </span>
            <div className="flex flex-col">
              <span className="tracking-wider uppercase text-sm sm:text-base font-black leading-tight">
                🔔 NEW ORDER
              </span>
              <span className="text-[10px] font-mono text-zinc-900 font-bold">
                Order #{orderId.startsWith('QF-') ? orderId : `QF-${orderId}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-urgent-dismiss"
            onClick={handleDismissClick}
            className="p-1.5 rounded-xl hover:bg-black/20 text-zinc-900 transition-colors cursor-pointer"
            title="Silence & Dismiss Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Order Header Summary */}
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                Order Reference
              </span>
              <h3 className="text-lg sm:text-xl font-black font-mono text-amber-400">
                #{orderId}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
                Total Amount
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ₹{safeAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="space-y-2 text-xs">
            {/* Customer Name & Order Time */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-zinc-400">Customer:</span>
              </div>
              <span className="font-bold text-white text-sm truncate max-w-[200px]">
                {customerName}
              </span>
            </div>

            {/* Customer Phone */}
            {customerPhone && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-zinc-400">Phone:</span>
                </div>
                <a
                  href={`tel:${customerPhone}`}
                  className="font-bold text-white font-mono hover:text-emerald-400 transition-colors"
                >
                  {customerPhone}
                </a>
              </div>
            )}

            {/* Delivery Address */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-zinc-400">Delivery Address:</span>
              </div>
              <div className="text-white font-medium pl-6 text-[12px] leading-relaxed break-words">
                {customerAddress || 'Vijayawada Central Delivery Zone'}
              </div>
            </div>

            {/* Ordered Products / Items Breakdown */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider font-mono">
                    Ordered Products ({Array.isArray(parsedItems) && parsedItems.length > 0 ? parsedItems.length : itemsCount})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pl-1 divide-y divide-zinc-800/60">
                {Array.isArray(parsedItems) && parsedItems.length > 0 ? (
                  parsedItems.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="font-medium text-zinc-200 truncate pr-2">
                        {item.name || 'QuickFit Garment'}
                        {item.size ? (
                          <span className="text-zinc-400 font-mono text-[11px] ml-1.5">
                            ({item.size})
                          </span>
                        ) : null}
                      </div>
                      <div className="font-mono font-bold text-amber-400 shrink-0">
                        × {item.quantity || item.qty || 1}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-300 font-medium text-xs">
                    {itemsCount} item{itemsCount === '1' ? '' : 's'} included in order
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Order Time row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[11px] font-semibold">Payment:</span>
                </div>
                <span className="font-black text-white text-xs">{paymentMethod}</span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-semibold">Time:</span>
                </div>
                <span className="font-black text-white text-xs font-mono">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Sound & Vibration Active Notice */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-[11px] font-semibold">
            <Volume2 className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
            <span>Alert chime is repeating continuously until you view or accept.</span>
          </div>

          {/* Actions: VIEW ORDER & ACCEPT ORDER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* View Order Button */}
            <button
              type="button"
              id="btn-urgent-view-order"
              onClick={handleViewClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700 active:scale-[0.98]"
            >
              <Eye className="w-4 h-4 text-zinc-300" />
              <span>👁 VIEW ORDER</span>
            </button>

            {/* Accept Order Button */}
            <button
              type="button"
              id="btn-urgent-accept-order"
              onClick={handleAcceptClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4 text-zinc-950" />
              <span>✅ ACCEPT ORDER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentOrderAlertModal;
