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
    <section className="relative overflow-hidden pt-6 pb-12 lg:pt-14 lg:pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN - CONTENT & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
              <span>●</span>
              <span>QUICKFIT · PREMIUM MEN'S WEAR</span>
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.08] font-heading uppercase">
              PREMIUM MEN'S <br />
              <span className="text-neutral-900">
                FASHION & FITS.
              </span>
            </h1>

            {/* SUBHEADLINE */}
            <p className="text-xs sm:text-base text-neutral-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Luxury oversized t-shirts, drop shoulder silhouettes, polo knits, and pure linen shirts crafted with heavyweight 240+ GSM cotton for modern streetwear drape.
            </p>

            {/* CTAs BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 pt-2">
              <button
                onClick={handleShopNow}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xs transition-all duration-200 flex items-center justify-center gap-2 !min-h-[46px] cursor-pointer active:scale-98"
              >
                <span>Shop Collection</span>
                <span>➔</span>
              </button>

              <button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-white border border-neutral-300 hover:border-black text-black font-black text-xs sm:text-sm tracking-wider uppercase shadow-xs hover:bg-neutral-50 transition-all duration-200 flex items-center justify-center gap-2 !min-h-[46px] cursor-pointer active:scale-98"
              >
                <span>Explore Categories</span>
                <span>↓</span>
              </button>
            </div>

            {/* SPECS */}
            <div className="pt-6 border-t border-neutral-200 grid grid-cols-3 gap-2 sm:gap-4 text-center lg:text-left max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-lg sm:text-2xl font-black text-black font-heading">240+ GSM</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase tracking-wider">Heavy Cotton</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-black font-heading">BOXY</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase tracking-wider">Modern Drape</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-black font-heading">FAST</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase tracking-wider">Express Dispatch</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - HERO IMAGE CARD */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => featuredProduct && openProductDetail(featuredProduct)}
              className="w-full max-w-xs sm:max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl border border-neutral-200 group cursor-pointer p-3 flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-neutral-100 mb-2.5">
                <img
                  src={heroImageSrc}
                  alt={featuredProduct?.name || "QuickFit Men's Streetwear"}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-black px-1">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                    {featuredProduct?.subcategory || "Streetwear Edition"}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black uppercase line-clamp-1">
                    {featuredProduct?.name || "Oversized Heavyweight Tee"}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-black text-black">
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

export default Hero;
