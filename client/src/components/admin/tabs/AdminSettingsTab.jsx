import React, { useState, useEffect } from 'react';
import { Settings, Lock, Store, Truck, Bell, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AdminSettingsTab = ({
  settings = {},
  onSaveSettings,
  onChangePassword
}) => {
  const [formData, setFormData] = useState({
    storeName: 'QuickFit Menswear Vijayawada',
    contactEmail: 'admin@quickfit.com',
    supportPhone: '+91 7396629821',
    storeAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
    deliveryFee: 49,
    freeDeliveryThreshold: 999,
    lowStockThreshold: 10,
    expressDeliveryTime: '45-60 Mins'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({
        storeName: settings.storeName || 'QuickFit Menswear Vijayawada',
        contactEmail: settings.contactEmail || 'admin@quickfit.com',
        supportPhone: settings.supportPhone || '+91 7396629821',
        storeAddress: settings.storeAddress || 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
        deliveryFee: settings.deliveryFee !== undefined ? settings.deliveryFee : 49,
        freeDeliveryThreshold: settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 999,
        lowStockThreshold: settings.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10,
        expressDeliveryTime: settings.expressDeliveryTime || '45-60 Mins'
      });
    }
  }, [settings]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onSaveSettings(formData);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsChangingPass(true);
    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPassMsg({ type: 'success', text: 'Admin password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6" />
            <span>Store Configuration & Security</span>
          </h2>
          <p className="text-xs text-zinc-400">
            System thresholds, pricing rules, customer contact profiles, and administrative credentials.
          </p>
        </div>
      </div>

      {/* STORE SETTINGS FORM */}
      <form onSubmit={handleSettingsSubmit} className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-white text-base">Store Profile & Dispatch SLA</h3>
            <p className="text-[11px] text-zinc-400">Public boutique contact and delivery billing parameters</p>
          </div>
        </div>

        {settingsSaved && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved and updated live!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Store Brand Name
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Support Email Address
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Support Phone / WhatsApp
            </label>
            <input
              type="text"
              value={formData.supportPhone}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Express Delivery Time SLA
            </label>
            <input
              type="text"
              value={formData.expressDeliveryTime}
              onChange={(e) => setFormData({ ...formData, expressDeliveryTime: e.target.value })}
              placeholder="45-60 Mins"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 text-xs">
            Boutique Flagship Address
          </label>
          <input
            type="text"
            value={formData.storeAddress}
            onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-zinc-800/80">
          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Delivery Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Free Delivery Threshold (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.freeDeliveryThreshold}
              onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Low Stock Warning Limit
            </label>
            <input
              type="number"
              min="1"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="py-3 px-6 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSavingSettings ? 'Saving...' : 'Save Store Settings'}</span>
        </button>
      </form>

      {/* SECURITY / PASSWORD FORM */}
      <form onSubmit={handlePasswordSubmit} className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-white text-base">Security & Password Management</h3>
            <p className="text-[11px] text-zinc-400">Update administrative dashboard authentication key</p>
          </div>
        </div>

        {passMsg.text && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            passMsg.type === 'error' ? 'bg-red-950/60 border border-red-800 text-red-300' : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
          }`}>
            <span>{passMsg.type === 'error' ? '⚠️' : '✓'}</span>
            <span>{passMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isChangingPass}
          className="py-3 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isChangingPass ? 'Updating...' : 'Update Admin Password'}</span>
        </button>
      </form>

    </div>
  );
};
