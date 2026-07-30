import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const Hero = () => {
  const { setSelectedCategory, setIsTrackingOpen } = useShop();

  const handleShopNow = () => {
    setSelectedCategory('All');
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExplore = () => {
    const categories = document.getElementById('categories');
    if (categories) {
      categories.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-slate-50 via-blue-50/40 to-slate-100">
      
      {/* BACKGROUND 3D LIGHTING ORBS */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN - CONTENT & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* LIVE AVERAGE SPEED TICKER */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-card border border-blue-200/80 shadow-sm text-xs font-bold text-slate-800">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span className="text-blue-700 font-extrabold uppercase tracking-wide">HYPERLOCAL EXPRESS</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">Avg <strong className="text-orange-600">42 Mins</strong> in MG Road & Benz Circle</span>
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] font-heading">
              Fashion Delivered <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
                In 1 Hour.
              </span>
            </h1>

            {/* SUBHEADLINE */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Order premium shirts, sarees, kurtis, and party wear from top local Vijayawada boutiques and get them delivered to your doorstep within <strong className="text-slate-900 font-semibold">60 minutes</strong>.
            </p>

            {/* CTAs BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={handleShopNow}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white font-extrabold text-base shadow-xl shadow-blue-600/35 hover:shadow-blue-600/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 btn-shimmer"
              >
                <span>Shop Now</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/90 border border-slate-300/80 text-slate-800 font-bold text-base shadow-md hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Explore Categories</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* TRUST BADGES TICKER */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center lg:text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">60 Min</div>
                <div className="text-xs text-slate-500 font-medium">Delivery Guarantee</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">50+</div>
                <div className="text-xs text-slate-500 font-medium">Vijayawada Stores</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">4.9 ★</div>
                <div className="text-xs text-slate-500 font-medium">Local Rating</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - 3D GLASSMORPHISM CAROUSEL CARD */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* MAIN 3D DISPLAY CARD */}
            <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden glass-card p-4 card-3d shadow-2xl border border-white/90">
              
              {/* Product Hero Image */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop"
                  alt="QuickFit Premium Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                {/* TOP FLOATING BADGE */}
                <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-900">Dispatched in 12 Mins</span>
                </div>

                {/* BOTTOM FLOATING PRODUCT DETAILS */}
                <div className="absolute bottom-4 left-4 right-4 glass-dark p-4 rounded-2xl text-white backdrop-blur-xl border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">MG Road Boutique</span>
                      <h3 className="text-base font-bold line-clamp-1 font-heading text-white">Kanchipuram Pure Silk Saree</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through">₹8,999</span>
                      <div className="text-lg font-black text-blue-400">₹5,499</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1">
                      <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.57l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.57l7-10a1 1 0 011.12-.384z" />
                      </svg>
                      35 Min Express Rider
                    </span>

                    <button
                      onClick={() => setIsTrackingOpen(true)}
                      className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                    >
                      Track Rider ➔
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* FLOATING EXTRA 3D PILL 1 */}
            <div className="absolute -top-6 -left-6 glass-card p-3 rounded-2xl hidden sm:flex items-center gap-3 shadow-xl animate-float border border-white/80 z-20">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Doorstep Trial</div>
                <div className="text-[10px] text-slate-500">Rider waits for try-on</div>
              </div>
            </div>

            {/* FLOATING EXTRA 3D PILL 2 */}
            <div className="absolute -bottom-6 -right-6 glass-card p-3 rounded-2xl hidden sm:flex items-center gap-3 shadow-xl animate-float-delayed border border-white/80 z-20">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                🏬
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Vijayawada Local</div>
                <div className="text-[10px] text-slate-500">Curated boutique wear</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
