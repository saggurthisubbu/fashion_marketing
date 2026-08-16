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
  Truck
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

export const AdminDashboardTab = ({
  analytics = {},
  ordersList = [],
  productsList = [],
  onNavigateTab,
  onUpdateOrderStatus
}) => {
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
            Store Performance Overview
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time analytics, inventory metrics, and dispatch monitoring across Vijayawada.
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

      {/* 4 Core Executive Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Revenue Summary */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Revenue Summary</span>
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
          <div className="text-[10px] text-zinc-400 font-mono">
            Lifetime orders logged
          </div>
        </div>

        {/* 3. Total Customers */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {analytics.totalCustomers !== undefined ? analytics.totalCustomers : 1}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Registered customer accounts
          </div>
        </div>

        {/* 4. Total Products */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Products</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-white">
            {analytics.totalProducts !== undefined ? analytics.totalProducts : productsList.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Active in catalog
          </div>
        </div>

        {/* 5. Pending Fulfillment */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pending Orders</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-heading text-amber-400">
            {analytics.pendingOrders || ordersList.filter(o => o.deliveryStatus === 'Pending' || o.deliveryStatus === 'Confirmed').length}
          </div>
          <div className="text-[10px] text-amber-300/80 font-mono">
            Requires dispatch
          </div>
        </div>

        {/* 6. Completed Deliveries */}
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
          <div className="text-[10px] text-emerald-400/80 font-mono">
            Successfully completed
          </div>
        </div>

      </div>

      {/* Low Stock Urgent Alert Banner */}
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

      {/* Analytics Charts & Delivery Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Sales Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">
                Sales & Revenue Analytics
              </h3>
              <p className="text-[11px] text-zinc-400">
                Daily transaction volume and revenue trend
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
              Last 7 Days
            </span>
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
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Delivery Status Overview */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">
                Delivery Breakdown
              </h3>
              <Truck className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-[11px] text-zinc-400 mb-4">
              Real-time fulfillment stages across current orders
            </p>

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
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <button
              onClick={() => onNavigateTab('delivery')}
              className="text-xs font-bold text-white hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <span>Manage Delivery Partners Fleet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider">
              Recent Express Orders
            </h3>
            <p className="text-[11px] text-zinc-400">
              Latest incoming purchases with status update controls
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-zinc-300 hover:text-white underline cursor-pointer"
          >
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
                  <td colSpan="6" className="p-6 text-center text-zinc-500">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord._id || ord.orderId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-white">
                      {ord.orderId}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{ord.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{ord.customer?.phone}</div>
                    </td>
                    <td className="p-3 text-zinc-300">
                      {ord.customer?.area || 'MG Road, Vijayawada'}
                    </td>
                    <td className="p-3 font-bold text-white font-mono">
                      ₹{ord.totalAmount}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                        ord.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : ord.deliveryStatus === 'Out For Delivery'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : ord.deliveryStatus === 'Cancelled'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
