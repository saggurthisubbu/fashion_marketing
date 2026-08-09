import React from 'react';
import { testimonialsData } from '../data/testimonials';

export const Testimonials = () => {
  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] sm:text-xs font-black tracking-wider uppercase">
            COMMUNITY REVIEWS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-heading text-white tracking-tight">
            Loved By Men Across Vijayawada
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Real feedback on our heavyweight fabrics, streetwear fits, and express doorstep dispatch.
          </p>
        </div>

        {/* REVIEWS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonialsData.map((review) => (
            <div
              key={review.id}
              className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-700/80 flex flex-col justify-between space-y-5 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 text-sm">
                    {'★'.repeat(review.rating)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-orange-400 text-[10px] font-black uppercase">
                    ⚡ {review.deliveryTime}
                  </span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed">
                  "{review.comment}"
                </p>
              </div>

              {/* USER INFO */}
              <div className="pt-4 border-t border-slate-700/60 flex items-center gap-3.5">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-600"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white font-heading">{review.name}</h4>
                  <div className="text-[11px] text-slate-400">{review.location}</div>
                  <div className="text-[10px] text-orange-400 font-semibold mt-0.5">Outfit: {review.outfit}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
