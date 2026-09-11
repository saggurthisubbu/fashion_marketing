import React from 'react';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl } from '../config/api';
import { ArrowRight } from 'lucide-react';

// Static fallback used ONLY if the API returns nothing after all retries
const FALLBACK_CATEGORIES = [
  {
    id: 'fallback-oversized',
    name: 'Oversized T-Shirts',
    description: '240+ GSM French Terry & Boxy Cuts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fallback-dropshoulder',
    name: 'Drop Shoulder T-Shirts',
    description: 'Relaxed Silhouettes & Bio-Washed Cotton',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fallback-polo',
    name: 'Polo T-Shirts',
    description: 'Double-Mercerized Luxury Pique Knits',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fallback-shirts',
    name: 'Shirts',
    description: '100% Pure European Linen & Formals',
    image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=800&auto=format&fit=crop',
  },
];

export const CategoriesSection = () => {
  const { setSelectedCategory, categories, isLoadingCategories } = useShop();

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Only show active categories from the DB
  const activeApiCategories = categories.filter((c) => c.isActive !== false);

  console.log(
    `[CATEGORIES] isLoading=${isLoadingCategories} | DB categories=${activeApiCategories.length}`,
    activeApiCategories.map((c) => ({ name: c.name, image: c.image }))
  );

  /* ── SKELETON — shown while the first DB fetch is in-flight ─────────── */
  if (isLoadingCategories && activeApiCategories.length === 0) {
    return (
      <section id="categories-section" className="py-14 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm flex flex-col animate-pulse"
              >
                <div className="bg-slate-100 aspect-[3/4]" />
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="h-4 w-28 bg-slate-200 rounded-full" />
                  <div className="h-3 w-full bg-slate-100 rounded-full" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── DISPLAY LIST — DB data if available, clean fallback otherwise ───── */
  const displayCategories =
    activeApiCategories.length > 0
      ? activeApiCategories.map((cat) => ({
          id: cat._id || cat.slug || cat.name,
          name: cat.name,
          slug: cat.name,
          description:
            cat.description && cat.description.trim()
              ? cat.description
              : 'Premium curated collection.',
          image: resolveImageUrl(cat.image),
        }))
      : FALLBACK_CATEGORIES;

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <section id="categories-section" className="py-14 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionHeader />

        {/* CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className="group cursor-pointer bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* IMAGE */}
              <div className="overflow-hidden bg-slate-100 aspect-[3/4]">
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
              </div>

              {/* CONTENT */}
              <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">

                {/* Category name */}
                <h3 className="text-sm sm:text-base font-black font-heading text-slate-900 leading-snug">
                  {cat.name}
                </h3>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                  {cat.description}
                </p>

                {/* Explore button */}
                <div className="pt-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-orange-500 transition-colors duration-200">
                    <span>Explore Now</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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

/* ── Section header (shared between skeleton & live render) ─────────────── */
const SectionHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-3">
    <div>
      <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight leading-tight">
        Shop by Collection
      </h2>
    </div>
    <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed">
      Engineered heavyweight fabrics and modern streetwear fits crafted for everyday luxury.
    </p>
  </div>
);

export default CategoriesSection;
