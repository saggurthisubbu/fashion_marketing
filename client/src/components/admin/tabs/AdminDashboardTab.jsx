import React from 'react';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Truck,
  Store,
  BarChart2,
  BoxesIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// ─── Store-Wise Analytics Grid (Super Admin only) ─────────────────────────────
const StoreAnalyticsGrid = ({ storeAnalytics = {}, onNavigateTab }) => {
  const { summary = {}, stores = [] } = storeAnalytics;

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
        <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-violet-400" />
          Store-Wise Performance
        </h3>
        <button
          onClick={() => onNavigateTab('stores')}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          Manage Stores <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Stores', value: summary.totalStores || 0, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Total Revenue', value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Orders', value: summary.totalOrders || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Products', value: summary.totalProducts || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-3 rounded-xl ${s.bg} border border-white/5`}>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-lg font-black font-heading ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-Store Cards */}
      {stores.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">No stores found. Add stores in the Stores tab.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div
              key={store._id}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
            >
              {/* Store Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-white text-sm">{store.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{store.address}</div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  store.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {store.status}
                </span>
              </div>

              {/* Owner */}
              {store.owner ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <div>
                    <span className="text-xs text-zinc-300 font-bold">{store.owner.name}</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5">{store.owner.adminId ? `(ID: ${store.owner.adminId})` : store.owner.email}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/30 border border-amber-800/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-300">No Admin Assigned</span>
                  <button onClick={() => onNavigateTab('store-owners')} className="text-[10px] text-amber-400 hover:text-amber-200 underline ml-auto cursor-pointer">
                    Add
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Revenue', value: `₹${(store.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
                  { label: 'Orders', value: store.totalOrders, color: 'text-blue-400' },
                  { label: 'Products', value: store.totalProducts, color: 'text-white' },
                  { label: 'Low Stock', value: store.lowStockProducts, color: store.lowStockProducts > 0 ? 'text-amber-400' : 'text-zinc-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-950/60 rounded-xl p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
                    <div className={`font-black text-base font-heading ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Out of Stock Warning */}
              {store.outOfStock > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  {store.outOfStock} product{store.outOfStock !== 1 ? 's' : ''} out of stock
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Store Admin Focused Dashboard ────────────────────────────────────────────
const StoreAdminDashboard = ({ analytics, ordersList, productsList, onNavigateTab, onUpdateOrderStatus }) => {
  const recentOrders = ordersList.slice(0, 5);
  const chartData = analytics.revenueTrends && analytics.revenueTrends.length > 0
    ? analytics.revenueTrends
    : [
        { day: 'Mon', revenue: 0, orders: 0 },
        { day: 'Tue', revenue: 0, orders: 0 },
        { day: 'Wed', revenue: 0, orders: 0 },
        { day: 'Thu', revenue: 0, orders: 0 },
        { day: 'Fri', revenue: 0, orders: 0 },
        { day: 'Sat', revenue: 0, orders: 0 },
        { day: 'Sun', revenue: 0, orders: 0 }
      ];

  return (
    <div className="space-y-6">
      {/* Store Admin Welcome */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-zinc-900/60 border border-violet-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Your Store Dashboard</h2>
            <p className="text-xs text-zinc-400">Manage your products, orders and inventory below.</p>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">My Products</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-heading text-white">{analytics.totalProducts ?? productsList.length}</div>
          <div className="text-[10px] text-zinc-500">In my store catalog</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-heading text-white">{analytics.totalOrders ?? ordersList.length}</div>
          <div className="text-[10px] text-zinc-500">Orders placed at my store</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-heading text-emerald-400">₹{(analytics.totalRevenue || 0).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-zinc-500">Revenue from my store</div>
        </div>

        <div className={`p-4 rounded-2xl border space-y-2 ${analytics.lowStockCount > 0 ? 'bg-amber-950/30 border-amber-800/50' : 'bg-zinc-900/90 border-zinc-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Low Stock</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${analytics.lowStockCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700/40 text-zinc-400'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-black font-heading ${analytics.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {analytics.lowStockCount ?? 0}
          </div>
          <div className={`text-[10px] ${analytics.lowStockCount > 0 ? 'text-amber-400/80' : 'text-zinc-500'}`}>
            {analytics.lowStockCount > 0 ? 'Products need restocking!' : 'All products in stock'}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      {analytics.lowStockProducts && analytics.lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Low Stock Alert
            </h3>
            <button onClick={() => onNavigateTab('inventory')} className="text-xs text-amber-400 hover:text-amber-200 underline cursor-pointer">
              Manage →
            </button>
          </div>
          <div className="space-y-2">
            {analytics.lowStockProducts.slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center justify-between bg-zinc-900/60 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className={`text-xs font-mono font-black ${p.stockQuantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {p.stockQuantity === 0 ? 'OUT OF STOCK' : `${p.stockQuantity} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Revenue Chart */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">Sales Trend</h3>
            <p className="text-[11px] text-zinc-400">Your store's last 7 days</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">7 Days</span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevStore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(value, name) => [name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevStore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">Recent Orders</h3>
          <button onClick={() => onNavigateTab('orders')} className="text-xs text-zinc-400 hover:text-white underline cursor-pointer">
            View All ({ordersList.length})
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No orders yet for your store.</div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(ord => (
              <div key={ord._id || ord.orderId} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div>
                  <span className="font-mono font-bold text-xs text-white">{ord.orderId}</span>
                  <span className="text-[10px] text-zinc-500 ml-2">{ord.customer?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">₹{ord.totalAmount}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ord.deliveryStatus === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                    ord.deliveryStatus === 'Cancelled' ? 'bg-red-500/20 text-red-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>{ord.deliveryStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const AdminDashboardTab = ({
  analytics = {},
  ordersList = [],
  productsList = [],
  onNavigateTab,
  onUpdateOrderStatus,
  adminUser = null,
  storeAnalytics = {}
}) => {
  const isStoreOwner = adminUser?.role === 'store_owner';

  // Render the focused Store Admin dashboard for store owners
  if (isStoreOwner) {
    return (
      <StoreAdminDashboard
        analytics={analytics}
        ordersList={ordersList}
        productsList={productsList}
        onNavigateTab={onNavigateTab}
        onUpdateOrderStatus={onUpdateOrderStatus}
      />
    );
  }

  // ─── Super Admin Dashboard ──────────────────────────────────────────────────
  const chartData = analytics.revenueTrends && analytics.revenueTrends.length > 0
    ? analytics.revenueTrends
    : [
        { day: 'Mon', revenue: 4500, orders: 3 },
        { day: 'Tue', revenue: 6200, orders: 4 },
        { day: 'Wed', revenue: 3800, orders: 2 },
        { day: 'Thu', revenue: 8900, orders: 6 },
        { day: 'Fri', revenue: 11200, orders: 8 },
        { day: 'Sat', revenue: 15600, orders: 11 },
        { day: 'Sun', revenue: 13400, orders: 9 }
      ];

  const recentOrders = ordersList.slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
            Super Admin Overview
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time analytics, multi-store inventory metrics, and dispatch monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            View All Orders ➔
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Revenue Summary */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            ₹{(analytics.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% growth</span>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {analytics.totalOrders !== undefined ? analytics.totalOrders : ordersList.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">Lifetime orders logged</div>
        </div>

        {/* 3. Total Customers */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Customers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {analytics.totalCustomers !== undefined ? analytics.totalCustomers : 1}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">Registered accounts</div>
        </div>

        {/* 4. Total Products */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Products</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {analytics.totalProducts !== undefined ? analytics.totalProducts : productsList.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">Active in catalog</div>
        </div>

        {/* 5. Pending Orders */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-amber-400">
            {analytics.pendingOrders || ordersList.filter(o => o.deliveryStatus === 'Pending' || o.deliveryStatus === 'Confirmed').length}
          </div>
          <div className="text-[10px] text-amber-300/80 font-mono">Requires dispatch</div>
        </div>

        {/* 6. Completed */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Delivered</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-emerald-400">
            {analytics.deliveredOrders || ordersList.filter(o => o.deliveryStatus === 'Delivered').length}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">Successfully completed</div>
        </div>

      </div>

      {/* Low Stock Alert Banner */}
      {(analytics.lowStockCount > 0 || analytics.outOfStockCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">
                Inventory Warning: {analytics.lowStockCount} items running low, {analytics.outOfStockCount || 0} out of stock.
              </div>
              <div className="text-[11px] text-amber-400/80">
                Restock products promptly to maintain 45-minute express delivery guarantees.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider self-start sm:self-auto cursor-pointer"
          >
            Manage Inventory
          </button>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">
                Sales & Revenue Analytics
              </h3>
              <p className="text-[11px] text-zinc-400">Daily transaction volume and revenue trend</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">Last 7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  formatter={(value, name) => [name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Status Breakdown */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">Delivery Breakdown</h3>
              <Truck className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-[11px] text-zinc-400 mb-4">Real-time fulfillment stages</p>
            <div className="space-y-3">
              {[
                { label: 'Delivered', count: ordersList.filter(o => o.deliveryStatus === 'Delivered').length, color: 'bg-emerald-400', text: 'text-emerald-400' },
                { label: 'Out For Delivery', count: ordersList.filter(o => o.deliveryStatus === 'Out For Delivery').length, color: 'bg-blue-400', text: 'text-blue-400' },
                { label: 'Confirmed / Packed', count: ordersList.filter(o => o.deliveryStatus === 'Confirmed' || o.deliveryStatus === 'Packed').length, color: 'bg-amber-400', text: 'text-amber-400' },
                { label: 'Pending', count: ordersList.filter(o => o.deliveryStatus === 'Pending').length, color: 'bg-zinc-400', text: 'text-zinc-400' },
                { label: 'Cancelled', count: ordersList.filter(o => o.deliveryStatus === 'Cancelled').length, color: 'bg-red-400', text: 'text-red-400' }
              ].map((item, idx) => {
                const total = ordersList.length || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">{item.label}</span>
                      <span className={item.text}>{item.count} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <button onClick={() => onNavigateTab('delivery')} className="text-xs font-bold text-white hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer">
              <span>Manage Delivery Partners Fleet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Store-Wise Analytics Section ─── */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <StoreAnalyticsGrid storeAnalytics={storeAnalytics} onNavigateTab={onNavigateTab} />
      </div>

      {/* Recent Orders Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">Recent Express Orders</h3>
            <p className="text-[11px] text-zinc-400">Latest incoming purchases with status update controls</p>
          </div>
          <button onClick={() => onNavigateTab('orders')} className="text-xs font-bold text-zinc-300 hover:text-white underline cursor-pointer">
            All Orders ({ordersList.length})
          </button>
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Area / Zone</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-zinc-500">No orders placed yet.</td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord._id || ord.orderId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-white">{ord.orderId}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{ord.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{ord.customer?.phone}</div>
                    </td>
                    <td className="p-3 text-zinc-300">{ord.customer?.area || 'MG Road, Vijayawada'}</td>
                    <td className="p-3 font-bold text-white font-mono">₹{ord.totalAmount}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                        ord.deliveryStatus === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        ord.deliveryStatus === 'Out For Delivery' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        ord.deliveryStatus === 'Cancelled' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {ord.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={ord.deliveryStatus}
                        onChange={(e) => onUpdateOrderStatus(ord._id, e.target.value)}
                        className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Out For Delivery">Out For Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
