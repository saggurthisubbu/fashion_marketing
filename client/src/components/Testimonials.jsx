import React from 'react';
import { testimonialsData } from '../data/testimonials';

export const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black tracking-wider uppercase">
            VIJAYAWADA LOVE & REVIEWS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-heading text-white">
            Loved By 10,000+ Vijayawada Shoppers
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            See how QuickFit is revolutionizing fashion delivery across MG Road, Benz Circle, and Patamata.
          </p>
        </div>

        {/* REVIEWS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsData.map((review) => (
            <div
              key={review.id}
              className="glass-dark p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6 card-3d shadow-2xl relative"
            >
              <div className="space-y-4">
                {/* RATING & DELIVERY TIME BADGE */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 text-sm">
                    {'★'.repeat(review.rating)}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase">
                    ⚡ {review.deliveryTime} Delivery
                  </span>
                </div>

                {/* COMMENT */}
                <p className="text-slate-300 text-sm italic leading-relaxed">
                  "{review.comment}"
                </p>
              </div>

              {/* USER PROFILE */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">{review.name}</h4>
                  <div className="text-xs text-slate-400">{review.location}</div>
                  <div className="text-[10px] text-blue-400 font-semibold">Ordered: {review.outfit}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PARTNER BOUTIQUES TICKER */}
        <div className="mt-16 pt-12 border-t border-white/10 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            OFFICIAL BOUTIQUE PARTNERS IN VIJAYAWADA
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70 text-slate-300 text-sm font-bold font-heading">
            <span>MG Road Trendz</span>
            <span>•</span>
            <span>Benz Circle Menswear</span>
            <span>•</span>
            <span>Vijayawada Silk Palace</span>
            <span>•</span>
            <span>Eluru Road Silks</span>
            <span>•</span>
            <span>Patamata Luxury Hub</span>
          </div>
        </div>

      </div>
    </section>
  );
};
