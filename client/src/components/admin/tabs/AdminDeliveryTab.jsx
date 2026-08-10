import React, { useState } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, CheckCircle2, AlertCircle, Trash2, Edit2 } from 'lucide-react';

export const AdminDeliveryTab = ({
  deliveryPartners = [],
  onAddPartner,
  onEditPartner,
  onDeletePartner
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleNumber: '',
    vehicleType: 'Bike',
    zone: 'Benz Circle & MG Road',
    status: 'Available'
  });

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicleNumber: '',
      vehicleType: 'Bike',
      zone: 'Benz Circle & MG Road',
      status: 'Available'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      phone: partner.phone,
      email: partner.email || '',
      vehicleNumber: partner.vehicleNumber,
      vehicleType: partner.vehicleType || 'Bike',
      zone: partner.zone || 'Vijayawada Central',
      status: partner.status || 'Available'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingPartner) {
      await onEditPartner(editingPartner._id, formData);
    } else {
      await onAddPartner(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6" />
            <span>Delivery Fleet & Hyperlocal Dispatch</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Vijayawada express delivery partners, active trip assignments, and live rider statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Partner</span>
        </button>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deliveryPartners.map((partner) => (
          <div
            key={partner._id}
            className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              {/* Partner Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white text-lg font-black font-heading">
                    🚴
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-base">{partner.name}</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">{partner.vehicleType} • {partner.vehicleNumber}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                  partner.status === 'Available'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : partner.status === 'On Delivery'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {partner.status}
                </span>
              </div>

              {/* Partner Details */}
              <div className="mt-4 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono">{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Zone: {partner.zone || 'Vijayawada Central'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/60 text-center">
                <div className="p-2 rounded-xl bg-zinc-950/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Active</div>
                  <div className="font-mono font-black text-white text-sm">{partner.activeOrdersCount || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Completed</div>
                  <div className="font-mono font-black text-white text-sm">{partner.completedDeliveries || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/60">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono">Rating</div>
                  <div className="font-mono font-black text-amber-400 text-sm">★ {partner.rating || 4.9}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex gap-1.5">
                {['Available', 'On Delivery', 'Offline'].map((st) => (
                  <button
                    key={st}
                    onClick={() => onEditPartner(partner._id, { ...partner, status: st })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      partner.status === st
                        ? 'bg-white text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st === 'On Delivery' ? 'En Route' : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(partner)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Partner Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeletePartner(partner._id, partner.name)}
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
                  title="Delete Partner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT PARTNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-heading font-black text-white text-base">
                {editingPartner ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98480..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="AP 16 XX 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold cursor-pointer"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">Delivery Zone</label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="Benz Circle & MG Road"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 font-black uppercase tracking-wider hover:bg-zinc-200"
                >
                  {editingPartner ? 'Update Partner' : 'Add Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
