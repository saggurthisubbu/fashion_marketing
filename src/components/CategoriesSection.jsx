import React from 'react';
import { categoriesData } from '../data/categories';
import { useShop } from '../context/ShopContext';

export const CategoriesSection = () => {
  const { setSelectedCategory } = useShop();

  const handleSelectCategory = (slug) => {
    setSelectedCategory(slug);
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-extrabold tracking-wider uppercase">
              CURATED COLLECTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading mt-2">
              Explore 3D Category Hubs
            </h2>
          </div>
          <p className="text-slate-600 text-sm max-w-md mt-3 md:mt-0">
            Browse high-demand Vijayawada boutique collections ready for 60-minute doorstep dispatch.
          </p>
        </div>

        {/* CATEGORIES GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoriesData.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.slug)}
              className="group relative h-72 rounded-3xl overflow-hidden glass-card cursor-pointer card-3d shadow-md hover:shadow-2xl transition-all duration-500"
            >
              {/* IMAGE BACKGROUND */}
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />

              {/* GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>

              {/* ITEM COUNT BADGE */}
              <div className="absolute top-4 right-4 glass-panel px-3 py-1 rounded-full border border-white/40">
                <span className="text-[10px] font-black text-slate-900">{cat.itemCount}</span>
              </div>

              {/* CARD DETAILS */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  60-MIN EXPRESS
                </span>
                <h3 className="text-2xl font-black font-heading text-white group-hover:text-blue-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {cat.tagline}
                </p>

                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-orange-400 transition-colors">
                  <span>Shop Collection</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
