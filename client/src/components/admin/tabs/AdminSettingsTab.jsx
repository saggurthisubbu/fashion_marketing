import React, { useState, useEffect } from 'react';
import { Settings, Lock, Store, Truck, Bell, Save, ShieldCheck, CheckCircle2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

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

  const [offerForm, setOfferForm] = useState({
    isActive: true,
    offerName: 'Special Flat \u20b9200 Discount',
    couponCode: 'QUICK200',
    discountAmount: 200,
    startDate: '',
    expiryDate: ''
  });
  const [isOfferSaving, setIsOfferSaving] = useState(false);
  const [offerSaved, setOfferSaved] = useState(false);

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

      if (settings.offer) {
        const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
        setOfferForm({
          isActive: settings.offer.isActive !== false,
          offerName: settings.offer.offerName || 'Special Flat \u20b9200 Discount',
          couponCode: (settings.offer.couponCode || 'QUICK200').trim().toUpperCase(),
          discountAmount: typeof settings.offer.discountAmount === 'number' ? settings.offer.discountAmount : 200,
          startDate: formatDate(settings.offer.startDate),
          expiryDate: formatDate(settings.offer.expiryDate)
        });
      }
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

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setIsOfferSaving(true);
    try {
      const payload = {
        offer: {
          isActive: offerForm.isActive,
          offerName: offerForm.offerName.trim(),
          couponCode: offerForm.couponCode.trim().toUpperCase(),
          discountAmount: Number(offerForm.discountAmount),
          startDate: offerForm.startDate ? new Date(offerForm.startDate).toISOString() : null,
          expiryDate: offerForm.expiryDate ? new Date(offerForm.expiryDate).toISOString() : null
        }
      };
      await onSaveSettings(payload);
      setOfferSaved(true);
      setTimeout(() => setOfferSaved(false), 3000);
    } finally {
      setIsOfferSaving(false);
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

      {/* MANAGE OFFERS SECTION */}
      <form onSubmit={handleOfferSubmit} className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-white text-base">Manage Offers &amp; Coupons</h3>
            <p className="text-[11px] text-zinc-400">Control the active store-wide discount offer — changes apply immediately to the storefront</p>
          </div>
        </div>

        {offerSaved && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Offer settings saved! The storefront banner and coupon validation are now updated.</span>
          </div>
        )}

        {/* ENABLE / DISABLE TOGGLE */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div>
            <p className="text-sm font-black text-white">Offer Active</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enable or disable the offer banner &amp; coupon validation</p>
          </div>
          <button
            type="button"
            onClick={() => setOfferForm(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              offerForm.isActive
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {offerForm.isActive ? (
              <><ToggleRight className="w-5 h-5" /><span>ENABLED</span></>
            ) : (
              <><ToggleLeft className="w-5 h-5" /><span>DISABLED</span></>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Offer Name / Label
            </label>
            <input
              type="text"
              required
              value={offerForm.offerName}
              onChange={(e) => setOfferForm({ ...offerForm, offerName: e.target.value })}
              placeholder="e.g. Special Flat \u20b9200 Discount"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Coupon Code
            </label>
            <input
              type="text"
              required
              value={offerForm.couponCode}
              onChange={(e) => setOfferForm({ ...offerForm, couponCode: e.target.value.toUpperCase() })}
              placeholder="e.g. QUICK200"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono font-bold focus:outline-none focus:border-amber-500 tracking-wider"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Will be auto-uppercased. Customers enter this at checkout.</p>
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Discount Amount (\u20b9)
            </label>
            <input
              type="number"
              required
              min="1"
              max="10000"
              value={offerForm.discountAmount}
              onChange={(e) => setOfferForm({ ...offerForm, discountAmount: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">FLAT \u20b9 off applied on the product subtotal.</p>
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={offerForm.startDate}
              onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Leave blank for no start restriction.</p>
          </div>

          <div>
            <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={offerForm.expiryDate}
              onChange={(e) => setOfferForm({ ...offerForm, expiryDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Leave blank for no expiry.</p>
          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="p-3 rounded-2xl bg-black border border-zinc-700 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Banner Preview</span>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">&#9889;</span>
            <span className="text-white font-extrabold text-xs tracking-wide">
              {offerForm.isActive
                ? `FLAT \u20b9${offerForm.discountAmount} OFF \u2014 Use Code: ${offerForm.couponCode || 'QUICK200'}`
                : 'Offer is currently DISABLED — banner hidden'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isOfferSaving}
          className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Tag className="w-4 h-4" />
          <span>{isOfferSaving ? 'Saving Offer...' : 'Save Offer Settings'}</span>
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
