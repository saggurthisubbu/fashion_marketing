import React from 'react';
import { categoriesData } from '../data/categories';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl } from '../config/api';
import { ArrowRight } from 'lucide-react';

export const CategoriesSection = () => {
  const { setSelectedCategory, products, categories, isLoadingCategories } = useShop();

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Build the display list from LIVE API categories.
   * While loading: show skeleton cards (prevents stale static data flash).
   * If API returns data: use live DB categories exclusively.
   * If API fails after all retries: fall back to static categoriesData.
   *
   * For each live category:
   *  - name, slug, image, description come from the DB (always fresh)
   *  - tagline / gradient fall back to static match if name matches
   *  - image is passed through resolveImageUrl so backend URLs work on Vercel
   */
  const activeApiCategories = categories.filter((c) => c.isActive !== false);

  // While the API is still loading, render skeleton cards to prevent stale flash
  if (isLoadingCategories && activeApiCategories.length === 0) {
    return (
      <section id="categories-section" className="py-14 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-3">
                Men's Apparel Hubs
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight leading-tight">
                Shop by Collection
              </h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed">
              Engineered heavyweight fabrics and modern streetwear fits crafted for everyday luxury.
            </p>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm flex flex-col animate-pulse">
                <div className="bg-slate-100 aspect-[3/4]" />
                <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">
                  <div className="h-2.5 w-16 bg-slate-100 rounded-full" />
                  <div className="h-4 w-24 bg-slate-200 rounded-full" />
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

  const displayCategories = activeApiCategories.length > 0
    ? activeApiCategories.map((liveCat) => {
        // Try to find a matching static entry for visual styling (tagline, gradient)
        const staticMatch = categoriesData.find(
          (s) =>
            s.name.toLowerCase() === liveCat.name.toLowerCase() ||
            s.slug?.toLowerCase() === liveCat.slug?.toLowerCase()
        );

        // Live product count from already-loaded products state
        const target = liveCat.name.trim().toLowerCase();
        const liveCount = products.filter((p) => {
          const sub = (p.subcategory || '').trim().toLowerCase();
          const cat = (p.category || '').trim().toLowerCase();
          const name = (p.name || '').trim().toLowerCase();

          if (target === 'shirts' || target === 'linen shirts' || target === 'linen-shirts') {
            if (sub.includes('t-shirt') || sub.includes('tshirt') || cat.includes('t-shirt') || cat.includes('tshirt')) {
              return false;
            }
            return (
              sub === 'shirts' ||
              sub === 'linen shirts' ||
              sub === 'formal shirts' ||
              sub === 'pure linen' ||
              cat === 'shirts' ||
              (name.includes('shirt') && !name.includes('t-shirt') && !name.includes('tshirt'))
            );
          }
          if (target.includes('oversized')) {
            return sub.includes('oversized') || name.includes('oversized');
          }
          if (target.includes('drop shoulder') || target.includes('dropshoulder')) {
            return sub.includes('drop shoulder') || sub.includes('dropshoulder') || name.includes('drop shoulder') || name.includes('dropshoulder');
          }
          if (target.includes('polo')) {
            return sub.includes('polo') || name.includes('polo');
          }
          return sub === target || cat === target || sub.includes(target);
        }).length;

        const displayCount =
          liveCount > 0
            ? liveCount
            : typeof liveCat.itemCount === 'number'
            ? liveCat.itemCount
            : null;

        const resolvedImage = resolveImageUrl(liveCat.image);
        console.debug(`[CATEGORIES] "${liveCat.name}" image: ${liveCat.image} → ${resolvedImage}`);

        return {
          id: liveCat._id || liveCat.slug || liveCat.name,
          name: liveCat.name,
          // Use category name as the filter slug — ProductCatalog normalizes for comparison
          slug: liveCat.name,
          tagline:
            liveCat.description && liveCat.description.trim()
              ? liveCat.description
              : staticMatch?.tagline || 'Premium curated collection.',
          image: resolvedImage, // ← full backend URL in prod, relative path in dev
          gradient: staticMatch?.gradient || 'from-slate-900 to-black',
          itemCount: displayCount
        };
      })
    : // Fallback: static data only used when API loading is done AND returned nothing
      categoriesData.map((staticCat) => {
        console.debug('[CATEGORIES] Using static fallback for:', staticCat.name);
        const target = staticCat.slug.trim().toLowerCase();
        const liveCount = products.filter((p) => {
          const sub = (p.subcategory || '').trim().toLowerCase();
          const cat = (p.category || '').trim().toLowerCase();
          const name = (p.name || '').trim().toLowerCase();

          if (target === 'shirts' || target === 'linen shirts' || target === 'linen-shirts') {
            if (sub.includes('t-shirt') || sub.includes('tshirt') || cat.includes('t-shirt') || cat.includes('tshirt')) {
              return false;
            }
            return (
              sub === 'shirts' ||
              sub === 'linen shirts' ||
              sub === 'formal shirts' ||
              sub === 'pure linen' ||
              cat === 'shirts' ||
              (name.includes('shirt') && !name.includes('t-shirt') && !name.includes('tshirt'))
            );
          }
          if (target.includes('oversized')) {
            return sub.includes('oversized') || name.includes('oversized');
          }
          if (target.includes('drop shoulder') || target.includes('dropshoulder')) {
            return sub.includes('drop shoulder') || sub.includes('dropshoulder') || name.includes('drop shoulder') || name.includes('dropshoulder');
          }
          if (target.includes('polo')) {
            return sub.includes('polo') || name.includes('polo');
          }
          return sub === target || cat === target || sub.includes(target);
        }).length;

        return {
          ...staticCat,
          image: resolveImageUrl(staticCat.image),
          itemCount: liveCount > 0 ? liveCount : null
        };
      });


  return (
    <section id="categories-section" className="py-14 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-3">
              Men's Apparel Hubs
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight leading-tight">
              Shop by Collection
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed">
            Engineered heavyweight fabrics and modern streetwear fits crafted for everyday luxury.
          </p>
        </div>

        {/* CATEGORY CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className="group cursor-pointer bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* IMAGE — full, no overlay */}
              <div className="relative overflow-hidden bg-slate-100 aspect-[3/4]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Minimal top-right badge only — tiny, unobtrusive */}
                {cat.itemCount !== null && cat.itemCount !== undefined && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black border border-slate-200 shadow-sm">
                      {cat.itemCount} Items
                    </span>
                  </div>
                )}
              </div>

              {/* CONTENT — fully below the image */}
              <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">

                {/* Edition label */}
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500">
                  Men's Edition
                </span>

                {/* Category name */}
                <h3 className="text-sm sm:text-base font-black font-heading text-slate-900 leading-snug">
                  {cat.name}
                </h3>

                {/* Tagline */}
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                  {cat.tagline}
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

export default CategoriesSection;
