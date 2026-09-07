import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, Eye, EyeOff, Sparkles, X, ArrowLeft } from 'lucide-react';

export const AdminLogin = ({ onLogin, isLoading, onClose }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!adminId.trim() || !password) {
      setErrorMsg('Please enter both Admin ID and Password.');
      return;
    }
    try {
      await onLogin(adminId.trim(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleFillMaster = () => {
    setAdminId('saggurthisubbu9@gmail.com');
    setPassword('QuickFitAdmin@2026!');
    setErrorMsg('');
  };

  const handleFillDemo = () => {
    setAdminId('admin@quickfit.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-6 bg-zinc-950 text-zinc-100 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close Admin Login"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="w-full max-w-md relative">
        {/* Subtle Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-700 rounded-3xl blur-md opacity-30"></div>

        <div className="relative bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-white shadow-inner">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono tracking-widest text-zinc-300 uppercase mb-1.5">
                <Lock className="w-2.5 h-2.5" />
                RESTRICTED PORTAL
              </div>
              <h1 className="text-2xl font-black font-heading tracking-tight text-white">
                Admin Access
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your administrative credentials to manage store operations.
              </p>
              {/* Store Owner hint */}
              <div className="mt-3 px-3 py-2 rounded-xl bg-violet-950/50 border border-violet-800/40 text-left">
                <p className="text-[11px] text-violet-300 font-bold mb-0.5">🏪 Store Admin Login</p>
                <p className="text-[10px] text-zinc-400">If you're a Store Admin, use your <strong className="text-zinc-200">Store ID</strong> (e.g. <span className="font-mono text-violet-300">store1</span>) or registered <strong className="text-zinc-200">Email</strong> to login.</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Admin ID / Email
              </label>
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleFillMaster}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors py-1.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-amber-400/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Master Admin (Subbu)</span>
              </button>
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-[11px] text-zinc-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 cursor-pointer"
              >
                <span>Fill Demo (admin@quickfit.com)</span>
              </button>
            </div>

            {onClose && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to QuickFit Store</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
