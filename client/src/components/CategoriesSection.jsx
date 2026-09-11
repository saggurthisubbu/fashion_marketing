import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl } from '../config/api';
import { ArrowRight } from 'lucide-react';

const PRIMARY_CATEGORIES = [
  {
    id: 'cat-oversized',
    name: 'Oversized T-Shirts',
    slug: 'Oversized T-Shirts',
    description: '240+ GSM heavyweight cotton with relaxed boxy streetwear drape.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-dropshoulder',
    name: 'Drop Shoulder T-Shirts',
    slug: 'Drop Shoulder T-Shirts',
    description: 'Extended shoulders and clean bio-washed minimal silhouette.',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-polo',
    name: 'Polo T-Shirts',
    slug: 'Polo T-Shirts',
    description: 'Double-mercerized fine cotton knit with structured collar.',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-shirts',
    name: 'Shirts',
    slug: 'Shirts',
    description: '100% pure linen and structured casual streetwear button-downs.',
    image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=800&auto=format&fit=crop',
  },
];

export const CategoriesSection = () => {
  const { setSelectedCategory, categories } = useShop();

  const handleCategoryClick = (categorySlug) => {
    setSelectedCategory(categorySlug);
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Map image from database category if available, while strictly preserving the 4 target categories
  const displayCategories = PRIMARY_CATEGORIES.map((base) => {
    const matchedDb = (categories || []).find(
      (c) => c.name?.toLowerCase().includes(base.slug.toLowerCase().split(' ')[0]) ||
             base.slug.toLowerCase().includes(c.name?.toLowerCase() || '')
    );
    return {
      ...base,
      image: matchedDb?.image ? resolveImageUrl(matchedDb.image) : base.image,
    };
  });

  return (
    <section id="categories-section" className="py-12 sm:py-16 bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block mb-1">
              CURATED COLLECTIONS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-neutral-950 tracking-tight">
              Men's Fits by Category
            </h2>
          </div>
          <p className="text-neutral-500 text-xs sm:text-sm max-w-sm leading-relaxed">
            Everyday heavyweight essentials engineered for structured drape and comfort.
          </p>
        </div>

        {/* 4 CATEGORIES GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className="group cursor-pointer bg-white border border-neutral-200/80 hover:border-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* IMAGE */}
              <div className="overflow-hidden bg-neutral-100 aspect-[3/4] relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 right-2.5 text-white font-black text-xs sm:text-sm tracking-tight truncate drop-shadow-sm">
                  {cat.name}
                </span>
              </div>

              {/* CONTENT */}
              <div className="p-3 sm:p-4 flex flex-col justify-between gap-2 flex-1">
                <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                  {cat.description}
                </p>

                <div className="pt-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-black group-hover:underline">
                    <span>Shop {cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CategoriesSection;
