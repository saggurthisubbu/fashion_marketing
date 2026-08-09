import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { WHATSAPP_BUSINESS_PHONE, BUSINESS_SUPPORT_EMAIL } from '../utils/whatsapp';

export const Footer = () => {
  const { setSelectedCategory, setIsContactModalOpen, setIsAboutModalOpen, showToast } = useShop();
  const [emailSub, setEmailSub] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailSub) {
      showToast('Thank you for subscribing to QuickFit Menswear releases! 🎉');
      setEmailSub('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* BRAND COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                ⚡
              </div>
              <span className="text-2xl font-black text-white font-heading tracking-tight">
                Quick<span className="text-slate-400">Fit</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Premium menswear engineered for modern silhouettes, heavyweight French Terry pure cotton, and clean monochrome aesthetics.
            </p>

            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                ● 100% Heavyweight Cotton
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                Vijayawada
              </span>
            </div>
          </div>

          {/* COLLECTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Men's Collections</h4>
            <ul className="space-y-2 text-xs font-medium">
              {[
                { label: 'Oversized T-Shirts', slug: 'Oversized T-Shirts' },
                { label: 'Drop Shoulder T-Shirts', slug: 'Drop Shoulder T-Shirts' },
                { label: 'Polo T-Shirts', slug: 'Polo T-Shirts' },
                { label: 'Linen & Pure Shirts', slug: 'Shirts' }
              ].map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY & ASSISTANCE */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">QuickFit Store</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => setIsAboutModalOpen(true)}
                  className="hover:text-white transition-colors"
                >
                  About Our Brand
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="hover:text-white transition-colors"
                >
                  Contact & Support
                </button>
              </li>
              <li className="flex items-center gap-2 pt-1 text-slate-300">
                <span>💬</span>
                <span>WhatsApp: <strong>+91 73966 29821</strong></span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span>📧</span>
                <span>Email: <strong>{BUSINESS_SUPPORT_EMAIL}</strong></span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span>📍</span>
                <span>MG Road, Vijayawada, AP - 520010</span>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Stay In The Loop</h4>
            <p className="text-xs text-slate-400">Get early access alerts on limited heavyweight drop releases.</p>
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={emailSub}
                onChange={(e) => setEmailSub(e.target.value)}
                placeholder="Enter your email..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors"
              >
                Subscribe ➔
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} QuickFit Menswear Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Shipping & Returns</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
