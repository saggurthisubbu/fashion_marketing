import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';

export const LoginPage = ({ onClose }) => {
  const {
    sendOtp,
    verifyOtp,
    updateCustomerProfile,
    showToast,
    user,
    checkoutRedirectPending
  } = useShop();

  const isCheckoutRedirect = checkoutRedirectPending ||
    new URLSearchParams(window.location.search).get('redirect') === 'checkout';

  // Step state: 'phone' | 'otp' | 'details'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Customer details for editing / initial setup
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    area: 'Benz Circle',
    landmark: '',
    pincode: '520010'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 10);
    // Pre-fill remembered phone if any
    const savedPhone = localStorage.getItem('quickfit_remember_phone');
    if (savedPhone) setPhone(savedPhone);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const cleanDigits = (val) => String(val || '').replace(/\D/g, '');

  const handlePhoneChange = (e) => {
    const val = cleanDigits(e.target.value).slice(0, 10);
    setPhone(val);
    setError('');
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const digits = cleanDigits(phone);
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(digits);
      localStorage.setItem('quickfit_remember_phone', digits);
      if (res.otp) {
        setDemoOtp(res.otp);
      }
      setStep('otp');
      setCountdown(30);
      setSuccess(`OTP sent to +91 ${digits}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleanOtp = cleanDigits(otp);
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const verifiedUser = await verifyOtp(phone, cleanOtp);

      // ONLY after successful OTP verification, load saved customer details
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

      setSuccess(verifiedUser.isReturningCustomer
        ? `Welcome back, ${verifiedUser.name}! Saved details loaded.`
        : 'Phone verified successfully!'
      );

      // Transition to customer details step so customer can review/edit details
      setStep('details');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save / Confirm Details & Continue
  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!customerDetails.name?.trim()) {
      setError('Please enter your full name.');
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

      showToast('Details saved successfully!', 'success');

      setTimeout(() => {
        window.history.replaceState({ modal: 'home' }, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        onClose?.();
      }, 400);
    } catch (err) {
      setError(err.message || 'Failed to save details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickProceed = () => {
    window.history.replaceState({ modal: 'home' }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 min-h-screen overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* BACKGROUND LUXURY ACCENT GLOWS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className="relative w-full max-w-md my-auto"
        style={{
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
          opacity: mounted ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* CARD */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800/10">

          {/* GOLD TOP ACCENT */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 40%, #DAA520 70%, #B8860B 100%)' }} />

          {/* CLOSE / BACK TO SHOP BUTTON */}
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({ modal: 'home' }, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
              onClose?.();
            }}
            className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Continue browsing without signing in"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Close</span>
          </button>

          <div className="px-7 pt-7 pb-7">
            {/* BRAND */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-lg font-black shadow-md">⚡</div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">QUICKFIT</span>
              </div>
              {isCheckoutRedirect && (
                <div className="mb-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  🔐 Sign in with mobile OTP to complete your order — your cart is saved!
                </div>
              )}
              <h1 className="text-xl font-black text-slate-900 mb-1">
                {step === 'phone' && 'Customer Sign In'}
                {step === 'otp' && 'Verify Mobile OTP'}
                {step === 'details' && 'Customer Profile & Address'}
              </h1>
              <p className="text-xs text-slate-500">
                {step === 'phone' && 'Enter your phone number to receive a verification OTP'}
                {step === 'otp' && `Enter the 6-digit OTP sent to +91 ${phone}`}
                {step === 'details' && 'Review or edit your saved details before ordering'}
              </p>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-rose-500 font-bold">⚠</span>
                <span className="text-xs font-semibold text-rose-600">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="text-xs font-semibold text-emerald-700">{success}</span>
              </div>
            )}

            {/* STEP 1: PHONE NUMBER INPUT */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Mobile Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-black text-slate-600 pointer-events-none select-none border-r border-slate-200 pr-2">
                      <span className="text-sm">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      maxLength={10}
                      autoFocus
                      className="w-full pl-20 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-mono tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                    We will send a 6-digit OTP code to verify your account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="relative w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all overflow-hidden disabled:opacity-50 cursor-pointer !min-h-[46px]"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    'Get Verification OTP ➔'
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Change Phone Number
                    </button>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => {
                      const val = cleanDigits(e.target.value).slice(0, 6);
                      setOtp(val);
                      setError('');
                    }}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center tracking-[0.5em] font-mono text-xl font-black py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />

                  {demoOtp && (
                    <div
                      onClick={() => setOtp(demoOtp)}
                      className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                      title="Click to auto-fill demo OTP"
                    >
                      <span>⚡ Demo OTP: <strong className="font-mono font-black">{demoOtp}</strong></span>
                      <span className="text-[10px] uppercase font-black text-amber-700 underline">Auto-fill</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="text-slate-400 font-mono font-bold">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="font-black text-slate-900 hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="relative w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all overflow-hidden disabled:opacity-50 cursor-pointer !min-h-[46px]"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying OTP...
                    </span>
                  ) : (
                    'Verify & Load Details ➔'
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: CUSTOMER DETAILS (SAVED DETAILS LOADED & EDITABLE) */}
            {step === 'details' && (
              <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs" noValidate>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                  <span>✅</span>
                  <span>
                    {customerDetails.name ? 'Saved details loaded from your account. You can edit them anytime.' : 'Verified! Please complete your name and delivery address.'}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone (Verified)</label>
                    <input
                      type="text"
                      disabled
                      value={`+91 ${customerDetails.phone || phone}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                      placeholder="name@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={customerDetails.street}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, street: e.target.value })}
                    placeholder="House/Flat No., Building, Street Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Area</label>
                    <input
                      type="text"
                      value={customerDetails.area}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, area: e.target.value })}
                      placeholder="e.g. Benz Circle"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={customerDetails.pincode}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, pincode: e.target.value })}
                      placeholder="520010"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer !min-h-[46px]"
                  >
                    {loading ? 'Saving Details...' : isCheckoutRedirect ? 'Save & Return to Checkout ➔' : 'Save Details & Start Shopping ➔'}
                  </button>
                  {customerDetails.name && (
                    <button
                      type="button"
                      onClick={handleQuickProceed}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Continue with Existing Details ➔
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* FOOTER NOTE */}
            <p className="text-center text-[10px] text-slate-400 mt-5 leading-relaxed">
              By continuing, you agree to QuickFit's{' '}
              <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span>
              {' '}and{' '}
              <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
