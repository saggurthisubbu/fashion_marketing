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
  Volume2
} from 'lucide-react';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE, handleImageError } from '../../config/api';

export const UrgentOrderAlertModal = ({
  orderAlert,
  pendingCount = 1,
  onAccept,
  onView
}) => {
  if (!orderAlert) return null;

  const {
    orderId = 'New',
    customerName = 'Valued Customer',
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
    console.log(`[FCM ORDER CLIENT] Accept Order clicked: #${orderId}`);
    if (typeof onAccept === 'function') {
      onAccept(orderId);
    }
  };

  const handleViewClick = () => {
    console.log(`[FCM ORDER CLIENT] View Order clicked: #${orderId}`);
    if (typeof onView === 'function') {
      onView(orderId);
    } else if (typeof onAccept === 'function') {
      onAccept(orderId);
    }
  };

  return (
    <div
      id="urgent-order-alert-backdrop"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      {/* Outer Glow Card */}
      <div
        id="urgent-order-alert-card"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-zinc-950 border-2 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.6)] text-white max-h-[94vh] flex flex-col"
      >
        {/* Urgent Pulsing Banner Top */}
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-5 sm:px-6 py-3.5 flex items-center justify-between text-zinc-950 font-black shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-black text-amber-400 shrink-0 shadow-md">
              <Bell className="w-5 h-5 animate-bounce" />
            </span>
            <div className="flex flex-col">
              <span className="tracking-wider uppercase text-sm sm:text-base font-black leading-tight flex items-center gap-2">
                <span>🚨 INCOMING NEW ORDER</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
              </span>
              <span className="text-[11px] font-mono text-zinc-900 font-extrabold">
                Order #{orderId.startsWith('QF-') ? orderId : `QF-${orderId}`}
              </span>
            </div>
          </div>

          {pendingCount > 1 && (
            <span className="px-2.5 py-1 rounded-full bg-black text-amber-400 font-mono text-xs font-black uppercase tracking-wider animate-pulse">
              {pendingCount} Orders Pending
            </span>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">

          {/* Reference & Total Amount */}
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
                Total Payable Amount
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ₹{safeAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* 1. ORDERED PRODUCTS WITH IMAGES, SIZES, QUANTITIES, PRICES */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-black text-zinc-200 uppercase text-[11px] tracking-wider font-heading">
                  Order Items ({Array.isArray(parsedItems) && parsedItems.length > 0 ? parsedItems.length : itemsCount})
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full">
                ⚡ Express 60-Min Dispatch
              </span>
            </div>

            <div className="divide-y divide-zinc-800/70 max-h-48 overflow-y-auto pr-1">
              {Array.isArray(parsedItems) && parsedItems.length > 0 ? (
                parsedItems.map((item, idx) => {
                  const itemImg = resolveImageUrl(item.image || item.imageUrl || item.images?.front || '');
                  const itemPrice = Number(item.price) || 0;
                  const itemQty = Number(item.quantity || item.qty || 1);

                  return (
                    <div key={idx} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* PRODUCT IMAGE */}
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                          <img
                            src={itemImg || DEFAULT_PLACEHOLDER_IMAGE}
                            alt={item.name || 'Product'}
                            onError={(e) => handleImageError(e, DEFAULT_PLACEHOLDER_IMAGE)}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        {/* PRODUCT DETAILS: NAME, SIZE, COLOR, QTY */}
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="font-black text-zinc-100 text-xs truncate">
                            {item.name || 'QuickFit Fashion Apparel'}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-semibold">
                            {item.size ? (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-black border border-zinc-700">
                                Size: {item.size}
                              </span>
                            ) : null}
                            <span>Qty: <strong className="text-white font-bold">{itemQty}</strong></span>
                            {item.color ? <span>· {item.color}</span> : null}
                          </div>
                        </div>
                      </div>

                      {/* ITEM PRICE */}
                      <div className="font-mono font-black text-emerald-400 text-xs shrink-0 text-right">
                        ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-2 text-zinc-300 font-medium text-xs">
                  {itemsCount} garment(s) included in this order.
                </div>
              )}
            </div>
          </div>

          {/* 2. CUSTOMER & DELIVERY ADDRESS DETAILS */}
          <div className="space-y-2 text-xs">
            {/* Customer Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-zinc-400">Customer:</span>
                </div>
                <span className="font-black text-white text-xs truncate max-w-[150px]">
                  {customerName}
                </span>
              </div>

              {customerPhone && (
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-zinc-400">Phone:</span>
                  </div>
                  <a
                    href={`tel:${customerPhone}`}
                    className="font-black text-white font-mono hover:text-emerald-400 transition-colors text-xs"
                  >
                    +91 {customerPhone.replace(/\D/g, '').slice(-10)}
                  </a>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-zinc-400">Delivery Address:</span>
              </div>
              <div className="text-white font-medium pl-6 text-[12px] leading-relaxed break-words">
                {customerAddress || 'Vijayawada Central Express Delivery Zone'}
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

          {/* Sound & Alert Active Notice */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-[11px] font-semibold">
            <Volume2 className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
            <span>🔊 Loud buzzer is ringing. Click View or Accept to stop buzzer.</span>
          </div>

          {/* Actions: VIEW ORDER & ACCEPT ORDER (Popup remains visible until one is clicked) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* View Order Button */}
            <button
              type="button"
              id="btn-urgent-view-order"
              onClick={handleViewClick}
              className="w-full py-4 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700 active:scale-[0.98] shadow-md !min-h-[48px]"
            >
              <Eye className="w-4 h-4 text-zinc-300" />
              <span>👁 VIEW ORDER</span>
            </button>

            {/* Accept Order Button */}
            <button
              type="button"
              id="btn-urgent-accept-order"
              onClick={handleAcceptClick}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98] !min-h-[48px]"
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
