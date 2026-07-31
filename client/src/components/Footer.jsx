import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const Footer = () => {
  const { setSelectedCategory, setIsTrackingOpen, setIsContactModalOpen, showToast } = useShop();
  const [emailSub, setEmailSub] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailSub) {
      showToast('Thank you for subscribing to QuickFit Vijayawada updates! 🎉');
      setEmailSub('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* BRAND COL */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                ⚡
              </div>
              <span className="text-2xl font-black text-white font-heading tracking-tight">
                Quick<span className="text-blue-500">Fit</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              QuickFit is Vijayawada's premier 1-Hour hyperlocal fashion express platform. Delivering luxury boutique wear directly from MG Road & Benz Circle to your doorstep within 60 minutes.
            </p>

            <div className="flex items-center gap-3 text-xs pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                ● 60 Min Guarantee
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                Vijayawada 5 KM
              </span>
            </div>
          </div>

          {/* QUICK CATEGORIES */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Express Collections</h4>
            <ul className="space-y-2 text-xs font-semibold">
              {['Men', 'Women', 'Kids', 'Shirts', 'Sarees', 'Kurtis'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {cat} Outfits
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Vijayawada Hub Contact</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span>WhatsApp: <strong className="text-white">+91 7396629821</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base">📧</span>
                <span>Email: <strong className="text-white">saggurthisubbu9@gmail.com</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <span>Radius: Vijayawada (5 KM)</span>
              </li>
              <li>
                <button
                  onClick={() => setIsTrackingOpen(true)}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-[11px] font-bold transition-colors"
                >
                  📍 Track Live Rider Map Demo
                </button>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Stay Updated</h4>
            <p className="text-xs text-slate-400">Get instant alerts on new boutique arrivals in Vijayawada.</p>
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={emailSub}
                onChange={(e) => setEmailSub(e.target.value)}
                placeholder="Enter your email..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} QuickFit Inc. All rights reserved. Vijayawada Express Division.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">60-Min Guarantee Terms</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
