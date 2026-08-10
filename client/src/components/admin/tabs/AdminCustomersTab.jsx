import React, { useState } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Eye,
  DollarSign
} from 'lucide-react';

export const AdminCustomersTab = ({
  customersList = [],
  onToggleBlockCustomer,
  onViewCustomerOrders
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const filteredCustomers = customersList.filter((cust) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    const matchesName = cust.name?.toLowerCase().includes(query);
    const matchesEmail = cust.email?.toLowerCase().includes(query);
    const matchesPhone = cust.phone?.includes(query);
    return matchesName || matchesEmail || matchesPhone;
  });

  const handleOpenHistory = async (cust) => {
    setSelectedCustomer(cust);
    setIsLoadingOrders(true);
    try {
      const orders = await onViewCustomerOrders(cust._id);
      setCustomerOrders(orders || []);
    } catch (err) {
      setCustomerOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6" />
            <span>Customer Accounts & Order History</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Registered customer profiles, lifetime purchase volume, contact records, and access controls.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, email, or phone number..."
          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
        />
      </div>

      {/* Customers Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Contact Information</th>
                <th className="p-3.5">Address & City</th>
                <th className="p-3.5">Total Orders</th>
                <th className="p-3.5">Lifetime Spend</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-zinc-500 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-zinc-600" />
                    <div>No registered customers found.</div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-zinc-800/40 transition-colors">
                    
                    {/* Name & Avatar */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center font-heading">
                          {cust.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{cust.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Joined {new Date(cust.createdAt || cust.registrationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3.5 space-y-0.5">
                      <div className="text-zinc-300 text-xs flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="text-zinc-400 font-mono text-[11px] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{cust.phone || 'Not provided'}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="p-3.5 text-zinc-300">
                      <div>{cust.address?.area || 'Benz Circle'}, {cust.address?.city || 'Vijayawada'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{cust.address?.pincode || '520010'}</div>
                    </td>

                    {/* Total Orders */}
                    <td className="p-3.5 font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white font-bold text-xs">
                        {cust.totalOrders || 0} Orders
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="p-3.5 font-mono font-bold text-white text-xs">
                      ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        cust.isBlocked
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {cust.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenHistory(cust)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Orders
                      </button>
                      <button
                        onClick={() => onToggleBlockCustomer(cust._id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                          cust.isBlocked
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/60'
                        }`}
                      >
                        {cust.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Purchase Records</span>
                <h3 className="font-heading font-black text-white text-base">{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {isLoadingOrders ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Loading order history...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No orders found for this customer.
                </div>
              ) : (
                customerOrders.map((ord) => (
                  <div key={ord._id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-white">#{ord.orderId}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(ord.orderDate || ord.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="text-zinc-300 text-[11px] truncate">
                          • {it.name} ({it.size || 'M'}) x{it.quantity || it.qty || 1}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <span className="font-bold text-white font-mono">₹{ord.totalAmount}</span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[9px] font-mono font-bold uppercase">
                        {ord.deliveryStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-zinc-200"
            >
              Close History
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
