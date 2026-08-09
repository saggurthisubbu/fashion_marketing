import React from 'react';
import { useShop } from '../context/ShopContext';

export const AboutModal = () => {
  const { isAboutModalOpen, setIsAboutModalOpen } = useShop();

  if (!isAboutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
              ⚡
            </div>
            <h3 className="text-xl font-black font-heading text-slate-900 tracking-tight">
              About QuickFit
            </h3>
          </div>
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-900 font-bold">QuickFit</strong> is an independent luxury streetwear menswear label engineered for modern silhouettes, clean monochrome aesthetics, and heavyweight pure cotton fabrications.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
              Our Brand Standards:
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
              <li><strong className="text-slate-900 font-semibold">240+ GSM Heavyweight French Terry:</strong> Substantial fabric drape that holds structure throughout the day.</li>
              <li><strong className="text-slate-900 font-semibold">Engineered Boxy & Drop Shoulder Fits:</strong> Proportional tailoring inspired by contemporary European minimalism.</li>
              <li><strong className="text-slate-900 font-semibold">100% Bio-Washed Combed Cotton:</strong> Ultra-soft hand feel with zero shrinkage and anti-pilling longevity.</li>
              <li><strong className="text-slate-900 font-semibold">Express Local Dispatch:</strong> Doorstep express delivery straight from our local fulfillment hub.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Flagship Studio
            </div>
            <div className="text-sm font-bold font-heading">QuickFit Menswear Studio</div>
            <div className="text-[11px] text-slate-300">MG Road, Vijayawada, Andhra Pradesh - 520010</div>
          </div>
        </div>

        <button
          onClick={() => setIsAboutModalOpen(false)}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition-colors"
        >
          Explore Collection ➔
        </button>

      </div>
    </div>
  );
};
