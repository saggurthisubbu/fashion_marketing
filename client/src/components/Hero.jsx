import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl } from '../config/api';

export const Hero = () => {
  const { setSelectedCategory, products, openProductDetail } = useShop();
  const featuredProduct = products.length > 0 ? products[0] : null;

  const handleShopNow = () => {
    setSelectedCategory('All');
    const catalog = document.getElementById('catalog-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExplore = () => {
    const categories = document.getElementById('categories-section');
    if (categories) {
      categories.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroImageSrc = resolveImageUrl(
    featuredProduct?.images?.front || featuredProduct?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop"
  );

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-slate-50 via-slate-100/60 to-white">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN - CONTENT & CTAs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              <span>QUICKFIT MEN'S STREETWEAR ARCHIVE</span>
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] font-heading uppercase">
              PREMIUM MEN'S <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
                FASHION & FITS.
              </span>
            </h1>

            {/* SUBHEADLINE */}
            <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Oversized T-Shirts, Drop Shoulder T-Shirts and Polo T-Shirts crafted with 240+ GSM heavyweight cotton for modern drape and durability.
            </p>

            {/* CTAs BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleShopNow}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 hover:bg-black text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 !min-h-[48px]"
              >
                <span>Shop Collection</span>
                <span>➔</span>
              </button>

              <button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-slate-300 text-slate-800 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2 !min-h-[48px]"
              >
                <span>Explore Men's Wear</span>
                <span>↓</span>
              </button>
            </div>

            {/* SPECS */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-3 text-center lg:text-left max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">240+ GSM</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Heavy Cotton</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">BOXY</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Modern Drape</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">EXPRESS</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Vijayawada Hub</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - HERO IMAGE CARD */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => featuredProduct && openProductDetail(featuredProduct)}
              className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group cursor-pointer"
            >
              <img
                src={heroImageSrc}
                alt={featuredProduct?.name || "QuickFit Men's Streetwear"}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-900">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                    {featuredProduct?.subcategory || "Heavy French Terry"}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black uppercase line-clamp-1">
                    {featuredProduct?.name || "Monochrome Boxy Oversized Tee"}
                  </h3>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm sm:text-base font-black text-slate-900">
                    ₹{featuredProduct?.price || 1499}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
