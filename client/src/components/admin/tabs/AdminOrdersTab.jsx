import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  User,
  ChevronRight,
  Send,
  MessageCircle,
  Store,
  Trash2
} from 'lucide-react';
import { resolveImageUrl, API_BASE_URL } from '../../../config/api';
import { formatAdminWhatsAppOrder } from '../../../utils/whatsapp';

const formatOrderDate = (dateVal) => {
  if (!dateVal) return 'Recently';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recently';
  }
};

export const AdminOrdersTab = ({
  ordersList = [],
  deliveryPartners = [],
  onUpdateOrderStatus,
  onAssignDeliveryPartner,
  onClearAllOrders
}) => {
  const safeOrdersList = Array.isArray(ordersList) ? ordersList : [];
  console.log('[ORDER UI] Loading orders. Total orders in state:', safeOrdersList.length);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Auto-open order details modal if acceptOrder is specified in URL query
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetOrderId = params.get('acceptOrder');
    if (!targetOrderId) return;

    if (safeOrdersList.length > 0) {
      const match = safeOrdersList.find(o => o?.orderId === targetOrderId || o?._id === targetOrderId);
      if (match) {
        setSelectedOrder(match);
        return;
      }
    }

    // Immediate fallback fetch if safeOrdersList is still loading or empty
    if (targetOrderId && targetOrderId !== 'new' && targetOrderId !== 'New') {
      fetch(`${API_BASE_URL}/orders/track/${encodeURIComponent(targetOrderId)}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && (data.orderId || data._id)) {
            setSelectedOrder(data);
          }
        })
        .catch(() => {});
    }
  }, [safeOrdersList]);

  // Status Filter options
  const statusOptions = ['All', 'Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'];

  // Filtered Orders
  const filteredOrders = safeOrdersList.filter((ord) => {
    if (!ord) return false;
    const matchesStatus = statusFilter === 'All' || ord.deliveryStatus === statusFilter;
    const query = searchTerm.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesId = ord.orderId ? String(ord.orderId).toLowerCase().includes(query) : false;
    const matchesName = ord.customer?.name ? String(ord.customer.name).toLowerCase().includes(query) : false;
    const matchesPhone = ord.customer?.phone ? String(ord.customer.phone).includes(query) : false;
    const matchesItem = Array.isArray(ord.items) && ord.items.some(it => it?.name ? String(it.name).toLowerCase().includes(query) : false);

    return matchesStatus && (matchesId || matchesName || matchesPhone || matchesItem);
  });

  const handleOpenAssignModal = (order) => {
    setAssigningOrderId(order._id);
    setSelectedPartnerId(order.assignedPartner?.id || '');
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedPartnerId) return;
    const partner = deliveryPartners.find(p => p._id === selectedPartnerId);
    if (!partner) return;

    await onAssignDeliveryPartner(assigningOrderId, {
      partnerId: partner._id,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      vehicleNumber: partner.vehicleNumber,
      deliveryStatus: 'Out For Delivery'
    });

    setIsAssignModalOpen(false);
    setAssigningOrderId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Package className="w-6 h-6" />
            <span>Order Management</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Track, fulfill, dispatch, and manage live customer purchases in real-time.
          </p>
        </div>

        {onClearAllOrders && (
          <div className="flex items-center gap-2">
            {!isConfirmingClear ? (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/60 text-zinc-400 hover:text-red-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                title="Clear all test orders and reset dashboard metrics to zero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset / Clear Test Orders</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/80 rounded-xl p-1.5 animate-in fade-in">
                <span className="text-[11px] font-bold text-red-200 px-2">Clear all orders?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAllOrders();
                    setIsConfirmingClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-[11px] cursor-pointer"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Customer, Phone, or Item..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="p-3.5">Order ID & Time</th>
                <th className="p-3.5">Customer & Address</th>
                <th className="p-3.5">Ordered Products & Qty</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Email Status</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Assigned Rider</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-500 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-zinc-600" />
                    <div>No orders match your filter.</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const emailStatus = String(ord.emailStatus || ord.emailDeliveryStatus || 'pending');
                  const isSent = emailStatus.toLowerCase() === 'sent';
                  const isFailed = emailStatus.toLowerCase() === 'failed';
                  const isSkipped = emailStatus.toLowerCase() === 'skipped';

                  return (
                    <tr key={ord._id || ord.orderId} className="hover:bg-zinc-800/40 transition-colors">
                      
                      {/* Order ID & Time */}
                      <td className="p-3.5 font-mono">
                        <div className="font-black text-white text-xs">{ord.orderId}</div>
                        <div className="text-[10px] text-zinc-400">
                          {formatOrderDate(ord.orderDate || ord.createdAt)}
                        </div>
                      </td>

                      {/* Customer & Address */}
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span>{ord.customer?.name || 'Customer'}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{ord.customer?.phone || ''}</span>
                        </div>
                        {ord.customer?.email ? (
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                            <Mail className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[150px]">{ord.customer.email}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500 italic">No email entered</div>
                        )}
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px] mt-0.5">
                          📍 {ord.customer?.address || 'Vijayawada'}, {ord.customer?.area || ''}
                        </div>
                      </td>

                      {/* Ordered Products & Qty */}
                      <td className="p-3.5 max-w-[220px]">
                        <div className="space-y-1">
                          {(Array.isArray(ord.items) ? ord.items : []).filter(Boolean).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-zinc-300 truncate font-medium">
                              • {it.name || 'Product'} <span className="text-zinc-400 font-mono">({it.size || 'M'}) ×{it.quantity || it.qty || 1}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-1 font-bold">
                          Qty Total: {(Array.isArray(ord.items) ? ord.items : []).reduce((sum, i) => sum + (i?.quantity || i?.qty || 1), 0)}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-3.5">
                        <div className="font-black text-white text-sm font-mono text-emerald-400">
                          ₹{ord.totalAmount}
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-zinc-300 font-mono mt-1">
                          <CreditCard className="w-2.5 h-2.5" />
                          <span>{ord.paymentMethod || 'COD'}</span>
                        </div>
                      </td>

                      {/* Email Status */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                          isSent ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' :
                          isFailed ? 'bg-rose-950 text-rose-400 border border-rose-800/80' :
                          isSkipped ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                          'bg-amber-950 text-amber-400 border border-amber-800/80'
                        }`}>
                          <span>{isSent ? '✓' : isFailed ? '✕' : '•'}</span>
                          <span>{emailStatus}</span>
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="p-3.5">
                        <select
                          value={ord.deliveryStatus}
                          onChange={(e) => onUpdateOrderStatus(ord._id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-black uppercase font-mono cursor-pointer transition-colors ${
                            ord.deliveryStatus === 'Delivered'
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                              : ord.deliveryStatus === 'Out For Delivery'
                              ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                              : ord.deliveryStatus === 'Cancelled'
                              ? 'bg-red-950/60 border-red-800 text-red-300'
                              : 'bg-amber-950/60 border-amber-800 text-amber-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Packed">Packed</option>
                          <option value="Out For Delivery">Out For Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                    {/* Assigned Rider */}
                    <td className="p-3.5">
                      {ord.assignedPartner?.name && String(ord.assignedPartner.name).trim() ? (
                        <div>
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>{String(ord.assignedPartner.name).trim().split(' ')[0]}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">{ord.assignedPartner.vehicleNumber || ''}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(ord)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold border border-zinc-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Assign Rider</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-2">
                      {/* WhatsApp with Photos */}
                      <button
                        onClick={() => {
                          const url = formatAdminWhatsAppOrder(ord);
                          window.open(url, '_blank');
                        }}
                        title="Send order details with product photos to WhatsApp"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                      {/* Order Details */}
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-black uppercase cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-heading font-black text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-zinc-400" />
                <span>Assign Delivery Partner</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select an available Vijayawada delivery rider to dispatch this order.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {deliveryPartners.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No delivery partners registered. Add partners in the Delivery tab.
                </div>
              ) : (
                deliveryPartners.map((partner) => (
                  <div
                    key={partner._id}
                    onClick={() => setSelectedPartnerId(partner._id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedPartnerId === partner._id
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{partner.name}</div>
                      <div className="text-[10px] opacity-80 font-mono">{partner.vehicleNumber} • {partner.zone}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                      partner.status === 'Available'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {partner.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedPartnerId}
                className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-50"
              >
                Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Order Receipt</span>
                <h3 className="font-heading font-black text-white text-lg">#{selectedOrder.orderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="font-bold text-white uppercase text-[10px] tracking-wider text-zinc-400">
                Delivery Location
              </div>
              <div className="font-bold text-white text-sm">{selectedOrder.customer?.name}</div>
              <div className="text-zinc-300">{selectedOrder.customer?.address}</div>
              <div className="text-zinc-400">{selectedOrder.customer?.landmark || 'Landmark not specified'}, {selectedOrder.customer?.area} - {selectedOrder.customer?.pincode}</div>
              <div className="font-mono text-zinc-300">Phone: {selectedOrder.customer?.phone}</div>
              {selectedOrder.customer?.email ? (
                <div className="font-mono text-zinc-300 flex items-center gap-2">
                  <span>Email: {selectedOrder.customer.email}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    (selectedOrder.emailStatus || selectedOrder.emailDeliveryStatus || '').toLowerCase() === 'sent' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' :
                    (selectedOrder.emailStatus || selectedOrder.emailDeliveryStatus || '').toLowerCase() === 'failed' ? 'bg-rose-950 text-rose-400 border border-rose-800/80' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    Email: {selectedOrder.emailStatus || selectedOrder.emailDeliveryStatus || 'pending'}
                  </span>
                </div>
              ) : (
                <div className="text-zinc-500 italic text-[11px]">Email: Not provided by customer</div>
              )}
              {selectedOrder.locationLink && (
                <a
                  href={selectedOrder.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-bold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Assigned Store */}
            {selectedOrder.assignedStore?.name && (
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2 text-xs">
                <div className="font-bold text-blue-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Assigned Store
                </div>
                <div className="font-bold text-white text-sm">{selectedOrder.assignedStore.name}</div>
                {selectedOrder.assignedStore.distanceKm !== null && selectedOrder.assignedStore.distanceKm !== undefined && (
                  <div className="text-blue-300 font-mono text-xs flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Delivery Distance: {Number(selectedOrder.assignedStore.distanceKm).toFixed(2)} km from {selectedOrder.assignedStore.name || 'RS FASHIONS'}
                  </div>
                )}
                {selectedOrder.customerLocation?.lat && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Destination GPS: {selectedOrder.customerLocation.lat.toFixed(6)}, {selectedOrder.customerLocation.lng.toFixed(6)}
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedOrder.customerLocation.lat},${selectedOrder.customerLocation.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-bold"
                    >
                      <MapPin className="w-3 h-3" />
                      Open Destination in Google Maps (for Rapido)
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Order Items Table */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
                Order Items ({(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).filter(Boolean).length})
              </div>
              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).filter(Boolean).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {it.image && (
                        <img
                          src={resolveImageUrl(it.image)}
                          alt={it.name || 'Product'}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                          className="w-10 h-12 object-cover rounded-lg border border-zinc-800 bg-zinc-900"
                        />
                      )}
                      <div>
                        <div className="font-bold text-white text-xs">{it.name || 'Product'}</div>
                        <div className="text-[10px] text-zinc-400">Size: {it.size || 'M'} • Qty: {it.quantity || it.qty || 1}</div>
                      </div>
                    </div>
                    <div className="font-bold font-mono text-white text-xs">
                      ₹{(Number(it.price) || 0) * (it.quantity || it.qty || 1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Payment Method:</span>
                <span className="text-white font-bold">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payment Status:</span>
                <span className={selectedOrder.paymentStatus === 'Paid' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedOrder.paymentStatus || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-zinc-800">
                <span>Grand Total:</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {/* WhatsApp + Close Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = formatAdminWhatsAppOrder(selectedOrder);
                  window.open(url, '_blank');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>📸 WhatsApp with Photos</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-zinc-200"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
