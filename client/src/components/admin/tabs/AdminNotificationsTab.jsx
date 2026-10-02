import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Package,
  Truck,
  Info,
  CheckCheck,
  Trash2,
  Smartphone,
  Volume2,
  ShieldCheck,
  Radio,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { playOrderNotificationSound, registerAdminPushNotifications } from '../../../config/firebase';

export const AdminNotificationsTab = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onNavigateTab,
  isPushEnabled = false,
  isRegisteringPush = false,
  onEnablePush,
  onTestPush
}) => {
  const [filterType, setFilterType] = useState('all');
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [localRegistering, setLocalRegistering] = useState(false);

  const handleTestNotificationSound = () => {
    // Replace order-alert.mp3 with any preferred buzzer/ringtone
    const demoId = 'DEMO-' + Math.floor(1000 + Math.random() * 9000);
    playOrderNotificationSound(demoId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickfit_new_order', {
        detail: {
          orderId: demoId,
          customer: {
            name: 'Priya Sharma (Demo Customer)',
            phone: '9876543210',
            address: 'Flat 402, Royal Residency, MG Road, Benz Circle, Vijayawada'
          },
          items: [
            {
              name: "MEN'S SLIM FIT LINEN SHIRT",
              size: 'L',
              color: 'Navy Blue',
              quantity: 1,
              price: 799,
              image: ''
            }
          ],
          totalAmount: 799,
          paymentMethod: 'UPI (GPay/PhonePe)',
          orderDate: new Date().toISOString()
        }
      }));
    }
  };

  const handleTriggerTestPush = async () => {
    if (!onTestPush) return;
    setIsTestingPush(true);
    try {
      await onTestPush();
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleEnablePushClick = async () => {
    if (onEnablePush) {
      return onEnablePush();
    }
    setLocalRegistering(true);
    try {
      const res = await registerAdminPushNotifications();
      if (res.success) {
        alert('Push notifications enabled! Real FCM token registered.');
      } else {
        alert(res.error || 'Failed to enable notifications');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLocalRegistering(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const registering = isRegisteringPush || localRegistering;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Store Alerts & Notification Feed</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time triggers for incoming orders, low stock warnings, rider dispatches, and push notification controls.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* ── FIREBASE CLOUD MESSAGING (FCM) PUSH NOTIFICATION CONTROLLER ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border-2 border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-white text-base">
                  Firebase Cloud Messaging (FCM) Push Notifications
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isPushEnabled
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-700'
                    : 'bg-amber-950/90 text-amber-400 border border-amber-700'
                }`}>
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>{isPushEnabled ? 'Active on Device' : 'Ready to Enable'}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Instant order alerts delivered to your Android phone or iPhone lockscreen, even when browser is closed or running in background.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              id="btn-test-order-alert-sound"
              onClick={handleTestNotificationSound}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-zinc-700/60"
              title="Play loud QuickFit admin order alert sound (/public/sounds/order-alert.mp3)"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Test Order Alert</span>
            </button>

            {onTestPush && (
              <button
                type="button"
                disabled={isTestingPush}
                onClick={handleTriggerTestPush}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                title="Send a sample order notification to phone lockscreen"
              >
                {isTestingPush ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>Test Phone Notification</span>
              </button>
            )}

            {/* Prominent Visible Push Notification Toggle Button */}
            <button
              type="button"
              id="btn-fcm-push-toggle"
              disabled={registering}
              onClick={handleEnablePushClick}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-50 ${
                isPushEnabled
                  ? 'bg-zinc-100 hover:bg-white text-zinc-950 border border-zinc-200'
                  : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 ring-2 ring-amber-400/40'
              }`}
              title={isPushEnabled ? "Re-generate and sync genuine FCM registration token with server" : "Request browser permission and register genuine FCM device token"}
            >
              {registering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Registering Push...</span>
                </>
              ) : isPushEnabled ? (
                <>
                  <span>🔄 Re-Sync Push Notifications</span>
                </>
              ) : (
                <>
                  <span>🔔 Enable Push Notifications</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong>Android Phones:</strong> Chrome, Edge, PWA Background Wake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong>iOS Devices:</strong> Safari PWA (Add to Home Screen) WebPush</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong>Order Details:</strong> Price, Customer, Items Count & Sound Chime</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'order', label: 'Orders' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'delivery', label: 'Delivery' },
          { id: 'system', label: 'System' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === tab.id
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-2">
            <Bell className="w-8 h-8 mx-auto text-zinc-600" />
            <div>No notifications in this category.</div>
          </div>
        ) : (
          filtered.map((n) => {
            const icons = {
              order: <Package className="w-4 h-4 text-white" />,
              inventory: <AlertTriangle className="w-4 h-4 text-amber-400" />,
              delivery: <Truck className="w-4 h-4 text-blue-400" />,
              system: <Info className="w-4 h-4 text-zinc-300" />
            };

            return (
              <div
                key={n._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.isRead
                    ? 'bg-zinc-900/95 border-zinc-700/80 shadow-lg'
                    : 'bg-zinc-900/40 border-zinc-800/80 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {icons[n.type] || <Bell className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-black text-white text-sm">
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.type === 'order' && (
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
                    >
                      View Orders
                    </button>
                  )}
                  {n.type === 'inventory' && (
                    <button
                      onClick={() => onNavigateTab('inventory')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Restock Item
                    </button>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => onMarkRead(n._id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
