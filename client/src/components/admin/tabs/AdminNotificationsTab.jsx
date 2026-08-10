import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Package, Truck, Info, CheckCheck, Trash2 } from 'lucide-react';

export const AdminNotificationsTab = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onNavigateTab
}) => {
  const [filterType, setFilterType] = useState('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6" />
            <span>Store Alerts & Notification Feed</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time triggers for incoming orders, low stock warnings, rider dispatches, and system health.
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
