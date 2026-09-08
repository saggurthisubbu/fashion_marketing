import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';

// Password strength helper
const getPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return { score: 0, label: '', color: '' };
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: '#ef4444' },
    { score: 2, label: 'Fair', color: '#f59e0b' },
    { score: 3, label: 'Good', color: '#3b82f6' },
    { score: 4, label: 'Strong', color: '#10b981' },
  ];
  return levels[score] || levels[0];
};

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

export const LoginPage = ({ onClose }) => {
  const { loginUser, showToast, user } = useShop();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 10);
    // Pre-fill remembered email
    const saved = localStorage.getItem('quickfit_remember_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  // If user is already authenticated or becomes authenticated, navigate to home (/)
  useEffect(() => {
    if (user) {
      window.history.replaceState({ modal: 'home' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      onClose?.();
    }
  }, [user, onClose]);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!validateEmail(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
      if (rememberMe) localStorage.setItem('quickfit_remember_email', email.trim());
      else localStorage.removeItem('quickfit_remember_email');
      setSuccess('Welcome back! Redirecting to QuickFit...');
      setTimeout(() => {
        window.history.replaceState({ modal: 'home' }, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        onClose?.();
      }, 500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !validateEmail(forgotEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    showToast('If this email exists, a reset link has been sent.', 'info');
    setForgotMode(false);
    setError('');
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

          <div className="px-8 pt-8 pb-8">
            {/* BRAND */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-lg font-black shadow-md">⚡</div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">QUICKFIT</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-1">
                {forgotMode ? 'Reset Your Password' : 'Sign In to Continue'}
              </h1>
              <p className="text-sm text-slate-500">
                {forgotMode ? 'Enter your email to receive a reset link' : 'Authentication required to access QuickFit collections'}
              </p>
            </div>

            {/* FORGOT PASSWORD FORM */}
            {forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-rose-500 text-sm">⚠</span>
                    <span className="text-xs font-semibold text-rose-600">{error}</span>
                  </div>
                )}
                <button type="submit" className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-black transition-all">
                  Send Reset Link
                </button>
                <button type="button" onClick={() => { setForgotMode(false); setError(''); }} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  ← Back to Sign In
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                {/* EMAIL */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(p => !p)}
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-slate-900 border-slate-900' : 'border-slate-300 hover:border-slate-500'}`}
                    style={{ width: 18, height: 18, flexShrink: 0 }}
                  >
                    {rememberMe && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Remember me for 30 days</span>
                </label>

                {/* ERROR / SUCCESS */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-rose-500">⚠</span>
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
                  className="relative w-full py-3.5 rounded-xl font-black text-sm text-white transition-all overflow-hidden disabled:opacity-70"
                  style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Signing In...
                    </span>
                  ) : 'Sign In to QuickFit'}
                </button>

                {/* DIVIDER */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* REGISTER LINK */}
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', '/register');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full py-3 rounded-xl border-2 border-slate-200 hover:border-slate-900 text-sm font-black text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Create New Account
                </button>
              </form>
            )}

            {/* FOOTER NOTE */}
            <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
              By signing in, you agree to QuickFit's{' '}
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
