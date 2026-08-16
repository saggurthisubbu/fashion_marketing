import React from 'react';
import { categoriesData } from '../data/categories';
import { useShop } from '../context/ShopContext';

export const CategoriesSection = () => {
  const { setSelectedCategory, products } = useShop();

  const handleCategoryClick = (categorySlug) => {
    setSelectedCategory(categorySlug);
    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categories-section" className="py-12 sm:py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-wider mb-2">
              MEN'S APPAREL HUBS
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight">
              Men's Curated Collections
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mt-2 sm:mt-0">
            Engineered heavyweight fabrics and modern streetwear fits crafted for everyday luxury.
          </p>
        </div>

        {/* 4 MEN'S CATEGORIES GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categoriesData.map((cat) => {
            const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const catNorm = normalize(cat.slug);

            const count = products.filter((p) => {
              const subNorm = normalize(p.subcategory);
              const mainNorm = normalize(p.category);
              const nameNorm = normalize(p.name);
              return (
                subNorm === catNorm ||
                subNorm.includes(catNorm) ||
                catNorm.includes(subNorm) ||
                mainNorm === catNorm ||
                nameNorm.includes(catNorm)
              );
            }).length;

            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer bg-slate-900 aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* BACKGROUND IMAGE */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-product.jpg';
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-95"
                />

                {/* DARK GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                {/* BADGE */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-sm">
                    {count > 0 ? `${count} Items` : cat.itemCount}
                  </span>
                </div>

                {/* CARD INFO */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 text-white space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-400">
                    MEN'S EDITION
                  </span>
                  <h3 className="text-base sm:text-xl font-black font-heading leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-slate-300 text-[11px] sm:text-xs line-clamp-1">
                    {cat.tagline}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    <span>Explore Now</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default CategoriesSection;
