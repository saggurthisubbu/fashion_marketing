import React from 'react';
import { featuresData } from '../data/features';
import { useShop } from '../context/ShopContext';

export const FeaturesGrid = () => {
  const { setIsTrackingOpen } = useShop();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Zap':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'Store':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10h4v11" />
          </svg>
        );
      case 'RefreshCw':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'MapPin':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'CreditCard':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'ShieldCheck':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold tracking-wider uppercase">
            WHY VIJAYAWADA LOVES QUICKFIT
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            The Hyperlocal Fashion Advantage
          </h2>
          <p className="text-slate-600 text-base">
            Combining the speed of instant delivery with the luxury of curated boutique fashion.
          </p>
        </div>

        {/* 3D LIFT FEATURE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature) => (
            <div
              key={feature.id}
              onClick={() => {
                if (feature.id === 'f4') setIsTrackingOpen(true);
              }}
              className="group glass-card p-8 rounded-3xl border border-slate-200/80 hover:border-blue-300 card-3d cursor-pointer relative overflow-hidden transition-all duration-300"
            >
              {/* TOP BADGE */}
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {getIcon(feature.icon)}
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 px-3 py-1 rounded-full transition-colors">
                  {feature.badge}
                </span>
              </div>

              {/* CARD TITLE & SUBTITLE */}
              <h3 className="text-xl font-bold text-slate-900 font-heading mb-1 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <div className="text-xs font-semibold text-orange-600 mb-3">
                {feature.subtitle}
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>

              {/* BOTTOM INTERACTIVE DECORATION */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>{feature.id === 'f4' ? 'Launch Live Map Demo ➔' : 'Guaranteed in Vijayawada'}</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* BACKGROUND HOVER GLOW */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-colors"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
