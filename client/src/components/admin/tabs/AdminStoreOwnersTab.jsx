import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Store,
  CheckCircle2,
  XCircle,
  Loader,
  X,
  Search,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Key
} from 'lucide-react';

// ─── Create / Edit Store Owner Modal ─────────────────────────────────────────
const StoreOwnerModal = ({ owner, storesList, onSave, onClose, isSaving }) => {
  const isEditing = !!owner;
  const [form, setForm] = useState({
    storeId: owner?.assignedStoreId?._id || owner?.assignedStoreId || storesList[0]?._id || '',
    name: owner?.name || '',
    email: owner?.email || '',
    adminId: owner?.adminId || '',
    phone: owner?.phone || '',
    password: '',
    confirmPassword: '',
    isBlocked: owner?.isBlocked || false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.storeId) e.storeId = 'Please select a store.';
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    if (!isEditing && !form.password) e.password = 'Password is required.';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password && form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      storeId: form.storeId,
      name: form.name.trim(),
      email: form.email.trim(),
      adminId: form.adminId.trim() || undefined,
      phone: form.phone.trim(),
      isBlocked: form.isBlocked
    };
    if (form.password) payload.password = form.password;
    onSave(payload, owner?._id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {isEditing ? 'Edit Store Admin' : 'Create Store Admin'}
              </h3>
              <p className="text-xs text-zinc-400">Manage store owner credentials & access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Store Assignment */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Assign to Store *
            </label>
            <select
              value={form.storeId}
              onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
              disabled={isEditing}
            >
              <option value="">-- Select Store --</option>
              {storesList.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {errors.storeId && <p className="text-red-400 text-xs mt-1">{errors.storeId}</p>}
            {isEditing && (
              <p className="text-xs text-zinc-500 mt-1">Store assignment cannot be changed here. Use the Stores tab.</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ravi Kumar"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email / Login ID *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="owner@store.com"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Admin ID (optional shortcode) */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Admin ID <span className="text-zinc-500 normal-case font-normal">(optional shortcode login)</span>
            </label>
            <input
              type="text"
              value={form.adminId}
              onChange={e => setForm(f => ({ ...f, adminId: e.target.value }))}
              placeholder="e.g. store1 or ravikumar"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">WhatsApp Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-zinc-500 mt-1">Used for WhatsApp order notifications</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500 pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {form.password && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, isBlocked: !f.isBlocked }))}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.isBlocked ? 'bg-red-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.isBlocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-zinc-300">
                {form.isBlocked ? '🔒 Account Blocked' : '✅ Account Active'}
              </span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm font-bold cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-black cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : (isEditing ? '✓ Update Account' : '+ Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const AdminStoreOwnersTab = ({
  storeOwnersList = [],
  storesList = [],
  onRefresh,
  API_BASE_URL,
  token,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = storeOwnersList.filter(o =>
    (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.adminId || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.store?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (payload, ownerId) => {
    setIsSaving(true);
    try {
      const url = ownerId
        ? `${API_BASE_URL}/api/admin/store-owners/${ownerId}`
        : `${API_BASE_URL}/api/admin/store-owners`;
      const method = ownerId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      showToast(ownerId ? 'Store owner updated!' : 'Store owner created!', 'success');
      setIsModalOpen(false);
      setEditingOwner(null);
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (owner) => {
    if (!confirm(`Delete store owner account for "${owner.name}"? This cannot be undone.`)) return;
    setDeletingId(owner._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/store-owners/${owner._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      showToast('Store owner deleted.', 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl font-black font-heading tracking-tight text-white flex items-center gap-2">
            <UserCog className="w-5 h-5 text-violet-400" />
            Store Admin Accounts
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Create and manage store owner login credentials</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingOwner(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Store Admin
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
        <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-bold text-violet-300">How Store Admin Access Works</p>
          <p>Each Store Admin can login using their <strong>Email</strong> or <strong>Admin ID</strong> at the <code className="bg-zinc-800 px-1 rounded">/admin</code> portal. They will only see their own store's products, orders, inventory, and sales — nothing else.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, email, ID or store..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-bold">No store admins found</p>
          <p className="text-xs text-zinc-600 mt-1">Create a store admin account to get started</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Admin</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Login ID</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Assigned Store</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-3 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((owner, i) => (
                <tr key={owner._id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/30'}`}>
                  <td className="px-3 py-3.5">
                    <div>
                      <div className="font-bold text-white text-sm">{owner.name}</div>
                      <div className="text-xs text-zinc-500">{owner.email}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    {owner.adminId ? (
                      <span className="font-mono text-xs bg-zinc-800 border border-zinc-700 text-emerald-300 px-2 py-0.5 rounded-lg">
                        {owner.adminId}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    {owner.store ? (
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-200 text-sm">{owner.store.name}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" /> No Store Assigned
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-zinc-400 text-xs">{owner.phone || '—'}</td>
                  <td className="px-3 py-3.5">
                    {owner.isBlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                        <XCircle className="w-3 h-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingOwner(owner); setIsModalOpen(true); }}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(owner)}
                        disabled={deletingId === owner._id}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 cursor-pointer transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === owner._id
                          ? <Loader className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-xs text-zinc-600 text-center">
          Showing {filtered.length} of {storeOwnersList.length} store admin{storeOwnersList.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <StoreOwnerModal
          owner={editingOwner}
          storesList={storesList}
          onSave={handleSave}
          onClose={() => { setIsModalOpen(false); setEditingOwner(null); }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
