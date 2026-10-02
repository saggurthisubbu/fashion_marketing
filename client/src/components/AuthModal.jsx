import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    sendOtp,
    verifyOtp,
    updateCustomerProfile,
    logoutUser,
    user,
    setIsAdminOpen,
    showToast
  } = useShop();

  // 'phone' | 'otp' | 'details'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    area: 'Benz Circle',
    landmark: '',
    pincode: '520010'
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const cleanDigits = (val) => String(val || '').replace(/\D/g, '');

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const digits = cleanDigits(phone);
    if (digits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(digits);
      if (res.otp) setDemoOtp(res.otp);
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const cleanOtp = cleanDigits(otp);
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const verifiedUser = await verifyOtp(phone, cleanOtp);
      const savedAddress = verifiedUser.address || {};
      const fullAddr = savedAddress.fullAddress || savedAddress.street || '';

      setCustomerDetails({
        name: verifiedUser.name || '',
        email: verifiedUser.email || '',
        phone: verifiedUser.phone || phone,
        street: fullAddr,
        area: savedAddress.area || 'Benz Circle',
        landmark: savedAddress.landmark || '',
        pincode: savedAddress.pincode || '520010'
      });

      if (!verifiedUser.name) {
        setStep('details');
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!customerDetails.name?.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      await updateCustomerProfile({
        name: customerDetails.name.trim(),
        email: customerDetails.email ? customerDetails.email.trim() : '',
        phone: customerDetails.phone || phone,
        address: {
          street: customerDetails.street ? customerDetails.street.trim() : '',
          fullAddress: customerDetails.street ? customerDetails.street.trim() : '',
          area: customerDetails.area || 'Benz Circle',
          landmark: customerDetails.landmark ? customerDetails.landmark.trim() : '',
          pincode: customerDetails.pincode || '520010',
          city: 'Vijayawada'
        }
      });
      showToast('Profile updated successfully!', 'success');
      setIsEditingProfile(false);
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show Account Profile card with saved details & edit option
  if (user) {
    const userAddr = user.address?.fullAddress || user.address?.street || (typeof user.address === 'string' ? user.address : '');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👤</span>
              <h3 className="text-lg font-black font-heading text-slate-900">
                My Customer Profile
              </h3>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-slate-900 text-base">
                    {user.name || 'QuickFit Customer'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role === 'customer' ? 'Verified Customer' : user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                  <span>📱 Phone:</span>
                  <strong className="text-slate-900 font-mono">+91 {user.phone}</strong>
                </p>
                {user.email && !user.email.endsWith('@customer.quickfit.in') && (
                  <p className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                    <span>✉️ Email:</span>
                    <span className="text-slate-900">{user.email}</span>
                  </p>
                )}
                {userAddr && (
                  <p className="text-xs text-slate-700 font-semibold flex items-start gap-2 pt-1 border-t border-slate-200">
                    <span>📍 Address:</span>
                    <span className="text-slate-900 leading-tight">
                      {userAddr}{user.address?.area ? `, ${user.address.area}` : ''}{user.address?.pincode ? ` - ${user.address.pincode}` : ''}
                    </span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomerDetails({
                    name: user.name || '',
                    email: user.email && !user.email.endsWith('@customer.quickfit.in') ? user.email : '',
                    phone: user.phone || '',
                    street: userAddr || '',
                    area: user.address?.area || 'Benz Circle',
                    landmark: user.address?.landmark || '',
                    pincode: user.address?.pincode || '520010'
                  });
                  setIsEditingProfile(true);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>✏️</span>
                <span>Edit Saved Details</span>
              </button>

              {(user.role === 'admin' || user.role === 'store_owner') && (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsAdminOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg border border-amber-400/40 cursor-pointer transition-all"
                >
                  <span>⚡</span>
                  <span>Open {user.role === 'store_owner' ? 'Store Dashboard' : 'Admin Dashboard'}</span>
                  <span>➔</span>
                </button>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    logoutUser();
                    setIsAuthModalOpen(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                Edit Your Details
              </h4>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  className="input-field"
                  placeholder="Rahul Sharma"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                  className="input-field"
                  placeholder="rahul@example.com"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={customerDetails.street}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, street: e.target.value })}
                  className="input-field"
                  placeholder="Flat/House, Street Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area</label>
                  <input
                    type="text"
                    value={customerDetails.area}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, area: e.target.value })}
                    className="input-field"
                    placeholder="Benz Circle"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={customerDetails.pincode}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, pincode: e.target.value })}
                    className="input-field"
                    placeholder="520010"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-black cursor-pointer shadow-md"
                >
                  {loading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Customer Not Logged In: Phone + OTP flow
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="text-lg font-black font-heading text-slate-900">
              {step === 'phone' ? 'Customer Sign In' : step === 'otp' ? 'Enter OTP' : 'Saved Details'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                WhatsApp / Mobile Number (+91)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-xs font-black text-slate-500 pointer-events-none select-none border-r border-slate-200 pr-2">
                  <span>🇮🇳 +91</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(cleanDigits(e.target.value).slice(0, 10));
                    setErrorMsg('');
                  }}
                  className="input-field !pl-20 !font-mono font-bold text-sm tracking-wider"
                  placeholder="98765 43210"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Password not required. We verify your account via secure 6-digit OTP.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || cleanDigits(phone).length !== 10}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold shadow-md transition-all uppercase tracking-wider text-xs !min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP ➔'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setErrorMsg(''); }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Change Number
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => {
                  setOtp(cleanDigits(e.target.value).slice(0, 6));
                  setErrorMsg('');
                }}
                className="input-field text-center font-mono text-xl tracking-[0.4em] font-black"
                placeholder="123456"
                autoFocus
              />

              {demoOtp && (
                <div
                  onClick={() => setOtp(demoOtp)}
                  className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-amber-100"
                >
                  <span>⚡ Demo OTP: <strong className="font-mono">{demoOtp}</strong></span>
                  <span className="text-[10px] uppercase font-black underline">Fill</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || cleanDigits(otp).length !== 6}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold shadow-md transition-all uppercase tracking-wider text-xs !min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Sign In ➔'}
            </button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold">
              ✅ Phone verified! Please enter your name and address for faster delivery.
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Delivery Address *</label>
              <input
                type="text"
                required
                value={customerDetails.street}
                onChange={(e) => setCustomerDetails({ ...customerDetails, street: e.target.value })}
                className="input-field"
                placeholder="Flat/House, Street Name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold shadow-md transition-all uppercase tracking-wider text-xs !min-h-[44px] cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save & Continue ➔'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
