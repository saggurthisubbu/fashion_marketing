import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return { score: 0, label: '', color: '', bars: [false, false, false, false] };
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const infos = [
    { label: '', color: '#e2e8f0', bars: [false, false, false, false] },
    { label: 'Weak',   color: '#ef4444', bars: [true, false, false, false] },
    { label: 'Fair',   color: '#f59e0b', bars: [true, true, false, false] },
    { label: 'Good',   color: '#3b82f6', bars: [true, true, true, false] },
    { label: 'Strong', color: '#10b981', bars: [true, true, true, true] },
  ];
  return { ...infos[score], score };
};

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
    )}
  </svg>
);

export const RegisterPage = ({ onClose }) => {
  const { loginUser, API_BASE_URL, showToast, user } = useShop();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => { setTimeout(() => setMounted(true), 10); }, []);
  // If user is already authenticated or becomes authenticated, navigate to home (/)
  useEffect(() => {
    if (user) {
      window.history.replaceState({ modal: 'home' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      onClose?.();
    }
  }, [user, onClose]);

  const set = (field, val) => { setForm(p => ({ ...p, [field]: val })); setError(''); };
  const touch = (field) => setTouched(p => ({ ...p, [field]: true }));

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^[+]?[\d\s\-()]{8,}$/.test(v);

  const pwdStrength = getPasswordStrength(form.password);

  const fieldErrors = {
    name: touched.name && form.name.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
    email: touched.email && !validateEmail(form.email) ? 'Please enter a valid email.' : '',
    phone: touched.phone && form.phone && !validatePhone(form.phone) ? 'Please enter a valid phone number.' : '',
    password: touched.password && form.password.length < 8 ? 'Password must be at least 8 characters.' : '',
    confirmPassword: touched.confirmPassword && form.confirmPassword && form.password !== form.confirmPassword ? 'Passwords do not match.' : '',
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    if (!form.name.trim() || form.name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (!validateEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    if (!form.phone.trim()) { setError('Please enter your phone number.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: 'customer',
      });
      setSuccess('Account created! Redirecting to QuickFit...');
      await loginUser(form.email.trim().toLowerCase(), form.password);
      setTimeout(() => {
        window.history.replaceState({ modal: 'home' }, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        onClose?.();
      }, 500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className="relative w-full max-w-md my-6"
        style={{
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
          opacity: mounted ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800/10">
          {/* GOLD ACCENT */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 40%, #DAA520 70%, #B8860B 100%)' }} />

          <div className="px-8 pt-8 pb-8">
            {/* BRAND */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-lg font-black shadow-md">⚡</div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">QUICKFIT</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-1">Create Your Account</h1>
              <p className="text-sm text-slate-500">Join QuickFit — Premium Men's Fashion</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>

              {/* FULL NAME */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  onBlur={() => touch('name')}
                  placeholder="Your full name"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.name ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                  }`}
                  autoComplete="name"
                  autoFocus
                />
                {fieldErrors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.name}</p>}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                  }`}
                  autoComplete="email"
                />
                {fieldErrors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>}
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  onBlur={() => touch('phone')}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.phone ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                  }`}
                  autoComplete="tel"
                />
                {fieldErrors.phone && <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.phone}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { set('password', e.target.value); touch('password'); }}
                    onBlur={() => touch('password')}
                    placeholder="Min. 8 characters"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.password ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                    }`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {/* PASSWORD STRENGTH BAR */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {pwdStrength.bars.map((active, i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: active ? pwdStrength.color : '#e2e8f0' }} />
                      ))}
                    </div>
                    {pwdStrength.label && (
                      <p className="text-xs font-semibold" style={{ color: pwdStrength.color }}>
                        {pwdStrength.label} password
                        {pwdStrength.score < 4 && ' — add uppercase, numbers, symbols for stronger security'}
                      </p>
                    )}
                  </div>
                )}
                {fieldErrors.password && <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.password}</p>}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => { set('confirmPassword', e.target.value); touch('confirmPassword'); }}
                    onBlur={() => touch('confirmPassword')}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.confirmPassword ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : form.confirmPassword && form.password === form.confirmPassword ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                      : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                    }`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    <EyeIcon open={showConfirm} />
                  </button>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <div className="absolute right-11 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">✓</div>
                  )}
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-rose-500 mt-1 font-medium">{fieldErrors.confirmPassword}</p>}
              </div>

              {/* ERROR / SUCCESS */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-rose-500 mt-0.5 flex-shrink-0">⚠</span>
                  <span className="text-xs font-semibold text-rose-600">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-xs font-semibold text-emerald-700">{success}</span>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-70"
                style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Creating Account...
                  </span>
                ) : 'Create My Account →'}
              </button>

              {/* DIVIDER */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400">ALREADY HAVE AN ACCOUNT?</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/login');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full py-3 rounded-xl border-2 border-slate-200 hover:border-slate-900 text-sm font-black text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                Sign In Instead
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-400 mt-5 leading-relaxed">
              By creating an account, you agree to QuickFit's{' '}
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

export default RegisterPage;
