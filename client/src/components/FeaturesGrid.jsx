import React from 'react';

export const FeaturesGrid = () => {
  const features = [
    {
      title: "100% Heavyweight Cotton",
      subtitle: "240+ GSM French Terry & Supima",
      description: "Crafted strictly with high-grade combed yarns for an ultra-soft handfeel, rich drape, and long-lasting streetwear durability.",
      icon: "✨"
    },
    {
      title: "Modern Streetwear Fits",
      subtitle: "Oversized & Drop Shoulder",
      description: "Carefully calibrated relaxed boxy silhouettes and drop shoulder seam drops engineered specifically for modern streetwear styling.",
      icon: "👔"
    },
    {
      title: "Express Local Dispatch",
      subtitle: "Direct From Vijayawada Hub",
      description: "Fast local processing and express doorstep delivery across MG Road, Benz Circle, Patamata, and Greater Vijayawada.",
      icon: "⚡"
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-[10px] sm:text-xs font-black tracking-wider uppercase">
            THE QUICKFIT QUALITY STANDARD
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
            Why Choose QuickFit Men's Fashion
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Zero compromises on fabric density, drape, and delivery speed.
          </p>
        </div>

        {/* 3 PILLARS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                {item.title}
              </h3>
              <div className="text-xs font-bold text-orange-600">
                {item.subtitle}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
