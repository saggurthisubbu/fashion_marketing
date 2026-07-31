import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const ContactModal = () => {
  const { isContactModalOpen, setIsContactModalOpen, showToast } = useShop();
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });

  if (!isContactModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const waUrl = `https://wa.me/917396629821?text=${encodeURIComponent(`👋 Hi QuickFit Team!\n\nName: ${formData.name}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}\n\n— Sent from QuickFit Vijayawada Website`)}`;
    window.open(waUrl, '_blank');
    showToast('Message sent via WhatsApp! ✅');
    setIsContactModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black font-heading text-slate-900">Contact QuickFit</h3>
            <p className="text-xs text-slate-500 mt-0.5">Vijayawada Hyperlocal Express Team</p>
          </div>
          <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://wa.me/917396629821"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <div>
              <div className="text-xs font-black text-emerald-900">WhatsApp Business</div>
              <div className="text-sm font-bold text-emerald-700">+91 73966 29821</div>
            </div>
          </a>

          <a
            href="mailto:saggurthisubbu9@gmail.com"
            className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl">📧</span>
            <div>
              <div className="text-xs font-black text-blue-900">Business Email</div>
              <div className="text-xs font-bold text-blue-700 break-all">saggurthisubbu9@gmail.com</div>
            </div>
          </a>
        </div>

        {/* Delivery Area Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">📍 Delivery Coverage: Vijayawada (5 KM Radius)</div>
          <div className="flex flex-wrap gap-2">
            {['MG Road', 'Benz Circle', 'Patamata', 'Eluru Road', 'Governorpet', 'Labbipet', 'Kunchanapalli', 'Moghalrajpuram'].map(area => (
              <span key={area} className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700">{area}</span>
            ))}
          </div>
        </div>

        {/* Quick Message Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Subbu" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone (+91)</label>
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="7396629821" />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Message</label>
            <textarea rows="3" required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input-field" placeholder="I'd like to know more about QuickFit's 60-minute fashion delivery..."></textarea>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all flex items-center justify-center gap-2">
            <span>💬</span> Send via WhatsApp
          </button>
        </form>

      </div>
    </div>
  );
};
