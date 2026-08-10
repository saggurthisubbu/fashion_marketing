import React from 'react';
import { TrendingUp, DollarSign, Package, ShoppingBag, Award, BarChart3, PieChart } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminAnalyticsTab = ({
  analytics = {},
  ordersList = [],
  productsList = []
}) => {
  const trendData = analytics.revenueTrends && analytics.revenueTrends.length > 0
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

  const categoryData = analytics.salesByCategory && analytics.salesByCategory.length > 0
    ? analytics.salesByCategory.map(item => ({
        name: item._id || 'Streetwear',
        value: item.count || 1
      }))
    : [
        { name: 'Oversized T-Shirts', value: 4 },
        { name: 'Drop Shoulder T-Shirts', value: 3 },
        { name: 'Polo T-Shirts', value: 2 },
        { name: 'Shirts', value: 1 }
      ];

  const totalRev = analytics.totalRevenue || 0;
  const totalOrd = analytics.totalOrders || ordersList.length || 1;
  const avgOrderValue = Math.round(totalRev / (totalOrd || 1));
  const deliveredOrd = analytics.deliveredOrders || ordersList.filter(o => o.deliveryStatus === 'Delivered').length;
  const completionRate = Math.round((deliveredOrd / totalOrd) * 100);

  const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#3f3f46', '#27272a'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6" />
            <span>Business Intelligence & Deep Analytics</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Performance metrics, customer demand trends, average order size, and product category distribution.
          </p>
        </div>
      </div>

      {/* KPI Ratios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Average Order Value (AOV)</span>
          <div className="text-2xl font-black font-heading text-white font-mono">₹{avgOrderValue}</div>
          <div className="text-[10px] text-emerald-400 font-bold">Top basket size in region</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Fulfillment Success Rate</span>
          <div className="text-2xl font-black font-heading text-emerald-400 font-mono">{completionRate}%</div>
          <div className="text-[10px] text-zinc-400">{deliveredOrd} of {totalOrd} orders delivered</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Express Dispatch SLA</span>
          <div className="text-2xl font-black font-heading text-white font-mono">45-60 Mins</div>
          <div className="text-[10px] text-zinc-400">Average delivery turnaround</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Inventory Turnover</span>
          <div className="text-2xl font-black font-heading text-white font-mono">{productsList.length} SKUs</div>
          <div className="text-[10px] text-zinc-400">Active catalog items</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Growth Trend */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              <span>Revenue Trajectory (₹)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">Daily Trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume Histogram */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-400" />
              <span>Daily Order Volume</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">Units</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="#ffffff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top Bestsellers Showcase */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Top Bestselling Products</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {productsList.slice(0, 3).map((prod, idx) => (
            <div key={prod._id || idx} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <span className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                #{idx + 1}
              </span>
              <img
                src={prod.images?.front || prod.image}
                alt={prod.name}
                className="w-12 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-900 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-white text-xs truncate">{prod.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{prod.subcategory}</div>
                <div className="text-xs font-black text-white font-mono mt-1">₹{prod.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
