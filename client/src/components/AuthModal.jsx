import React, { useState } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, API_BASE_URL, showToast } = useShop();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street: 'MG Road',
    area: 'Benz Circle'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'login') {
        await loginUser(formData.email, formData.password);
        setIsAuthModalOpen(false);
      } else {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: { street: formData.street, area: formData.area }
        });
        showToast('Registration successful! Welcome to QuickFit 🎉');
        await loginUser(formData.email, formData.password);
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-black font-heading text-slate-900">
              {mode === 'login' ? 'Customer Sign In' : 'Create QuickFit Account'}
            </h3>
          </div>
          <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Subbu Saggurthi"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="saggurthisubbu9@gmail.com"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">WhatsApp Phone Number (+91)</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="7396629821"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition-all mt-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In ➔' : 'Register Account ➔'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs">
          {mode === 'login' ? (
            <p className="text-slate-500">
              New to QuickFit?{' '}
              <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">
                Create an Account
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-blue-600 font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
