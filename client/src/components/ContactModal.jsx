import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { WHATSAPP_BUSINESS_PHONE, BUSINESS_SUPPORT_EMAIL } from '../utils/whatsapp';

export const ContactModal = () => {
  const { isContactModalOpen, setIsContactModalOpen, showToast } = useShop();
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });

  if (!isContactModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const waUrl = `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(
      `Hello QuickFit Support Team,\n\nName: ${formData.name}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}\n\n— Sent from QuickFit Store Contact Page`
    )}`;
    window.open(waUrl, '_blank');
    showToast('Opening WhatsApp to connect with support... 💬');
    setIsContactModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl font-black font-heading text-slate-900 tracking-tight">
              Contact QuickFit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Menswear Support & Store Enquiries
            </p>
          </div>
          <button
            onClick={() => setIsContactModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* OFFICIAL BUSINESS CONTACT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_BUSINESS_PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <span className="text-2xl">💬</span>
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                WhatsApp Support
              </div>
              <div className="text-xs font-black text-emerald-700 mt-0.5">
                +91 73966 29821
              </div>
            </div>
          </a>

          <a
            href={`mailto:${BUSINESS_SUPPORT_EMAIL}`}
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <span className="text-2xl">📧</span>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
                Business Email
              </div>
              <div className="text-xs font-black text-slate-800 mt-0.5 truncate max-w-[150px]">
                {BUSINESS_SUPPORT_EMAIL}
              </div>
            </div>
          </a>
        </div>

        {/* STORE LOCATION */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Store Location
          </div>
          <div className="text-xs font-bold font-heading">
            QuickFit Menswear Flagship Store
          </div>
          <div className="text-[11px] text-slate-300">
            MG Road, Vijayawada, Andhra Pradesh - 520010
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold pt-1">
            Open: Mon - Sun | 10:00 AM - 10:00 PM
          </div>
        </div>

        {/* MESSAGE FORM */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Rahul"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone (+91)</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Message / Order Query</label>
            <textarea
              rows="3"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="input-field"
              placeholder="Ask about size recommendations, fabric weight, or order status..."
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            <span>💬 Send Message on WhatsApp</span>
          </button>
        </form>

      </div>
    </div>
  );
};
