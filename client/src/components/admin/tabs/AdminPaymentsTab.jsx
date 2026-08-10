import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle2, Clock, Search, ArrowDownLeft, ShieldCheck } from 'lucide-react';

export const AdminPaymentsTab = ({
  paymentsData = {},
  ordersList = [],
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  const transactions = ordersList.map((o) => ({
    _id: o._id,
    orderId: o.orderId,
    customerName: o.customer?.name || 'Customer',
    customerPhone: o.customer?.phone || '',
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod || 'COD',
    paymentStatus: o.paymentStatus || 'Pending',
    deliveryStatus: o.deliveryStatus,
    date: o.orderDate || o.createdAt
  }));

  const totalCollected = transactions
    .filter(t => t.paymentStatus === 'Paid')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const pendingCollection = transactions
    .filter(t => t.paymentStatus === 'Pending' && t.deliveryStatus !== 'Cancelled')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const filtered = transactions.filter((t) => {
    const matchesMethod = methodFilter === 'All' || t.paymentMethod?.toLowerCase().includes(methodFilter.toLowerCase());
    const query = searchTerm.toLowerCase().trim();
    if (!query) return matchesMethod;
    return matchesMethod && (t.orderId?.toLowerCase().includes(query) || t.customerName?.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6" />
            <span>Payments Ledger & Settlements</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time financial transactions, UPI verification, Cash on Delivery collections, and reconciliation.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Settled (Paid)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-heading text-emerald-400 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-zinc-400">Completed & verified transactions</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pending Settlement (COD/UPI)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-heading text-amber-400 font-mono">
            ₹{pendingCollection.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-zinc-400">To be collected upon doorstep delivery</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Transactions</span>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black font-heading text-white font-mono">
            {transactions.length} records
          </div>
          <div className="text-[10px] text-zinc-400">Lifetime payment logs</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments by Order ID or Customer..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {['All', 'COD', 'UPI', 'Razorpay'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                methodFilter === m ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-zinc-500 space-y-2">
                    <CreditCard className="w-8 h-8 mx-auto text-zinc-600" />
                    <div>No transactions recorded yet.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-black text-white">
                      #{tx.orderId}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{tx.customerName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{tx.customerPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-white text-xs">
                      ₹{tx.totalAmount}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        tx.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tx.paymentStatus === 'Refunded'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400 font-mono text-[11px]">
                      {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-right">
                      <select
                        value={tx.paymentStatus}
                        onChange={(e) => onUpdatePaymentStatus(tx._id, e.target.value)}
                        className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Mark as Paid</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Failed">Failed</option>
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
