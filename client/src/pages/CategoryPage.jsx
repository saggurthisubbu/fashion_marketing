import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export const slugifyCategory = (name = '') => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const STANDARD_CATEGORIES = [
  { label: 'Shirts', slug: 'shirts', dbName: 'Shirts' },
  { label: 'Oversized T-Shirts', slug: 'oversized-t-shirts', dbName: 'Oversized T-Shirts' },
  { label: 'Drop Shoulder T-Shirts', slug: 'drop-shoulder-t-shirts', dbName: 'Drop Shoulder T-Shirts' },
  { label: 'Polo T-Shirts', slug: 'polo-t-shirts', dbName: 'Polo T-Shirts' }
];

export const CategoryPage = ({ slug, onNavigateHome }) => {
  const {
    products = [],
    categories = [],
    isLoadingProducts,
    productsError,
    fetchProducts
  } = useShop();

  const [sortBy, setSortBy] = useState('newest');

  // Scroll to top whenever slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  // Build full list of category links (standard + active DB categories)
  const allCategoryTabs = useMemo(() => {
    const list = [...STANDARD_CATEGORIES];
    (categories || []).forEach((c) => {
      if (c.isActive !== false && c.name) {
        const cSlug = slugifyCategory(c.name);
        const exists = list.some((item) => item.slug === cSlug);
        if (!exists) {
          list.push({ label: c.name, slug: cSlug, dbName: c.name });
        }
      }
    });
    return list;
  }, [categories]);

  // Find active category item from slug
  const currentCategory = useMemo(() => {
    const normalizedSlug = (slug || '').toLowerCase().trim();
    const found = allCategoryTabs.find((c) => c.slug === normalizedSlug);
    if (found) return found;

    // Fallback if slug formatting has minor variations
    const byDb = allCategoryTabs.find(
      (c) => slugifyCategory(c.dbName) === normalizedSlug || c.dbName.toLowerCase() === normalizedSlug
    );
    if (byDb) return byDb;

    // Generic formatting for unknown slugs
    const formatted = normalizedSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { label: formatted, slug: normalizedSlug, dbName: formatted };
  }, [slug, allCategoryTabs]);

  // Navigate to another category page
  const handleSelectCategorySlug = (targetSlug) => {
    if (targetSlug === 'all') {
      if (typeof onNavigateHome === 'function') {
        onNavigateHome();
      } else {
        window.history.pushState({ modal: 'home' }, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }
    window.history.pushState({ modal: 'category', slug: targetSlug }, '', `/category/${targetSlug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Filter products for this category
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const catSlug = (currentCategory.slug || '').toLowerCase();
    const catName = (currentCategory.dbName || '').toLowerCase();

    return products.filter((item) => {
      const sub = (item.subcategory || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();

      // Shirts matching: any shirt category/name, strictly excluding t-shirts and tees
      if (catSlug === 'shirts' || catName === 'shirts') {
        const isTShirt = (
          sub.includes('t-shirt') ||
          sub.includes('tshirt') ||
          cat.includes('t-shirt') ||
          cat.includes('tshirt') ||
          name.includes('t-shirt') ||
          name.includes('tshirt') ||
          name.includes(' tee') ||
          name.endsWith('tee') ||
          name.startsWith('tee ') ||
          sub.includes('drop shoulder') ||
          sub.includes('polo') ||
          sub.includes('oversized')
        );
        if (isTShirt) return false;
        return (
          sub.includes('shirt') ||
          cat.includes('shirt') ||
          name.includes('shirt')
        );
      }

      // Oversized T-Shirts
      if (catSlug === 'oversized-t-shirts' || catName.includes('oversized')) {
        return (
          sub.includes('oversized') ||
          cat.includes('oversized') ||
          name.includes('oversized')
        );
      }

      // Drop Shoulder T-Shirts
      if (catSlug === 'drop-shoulder-t-shirts' || catName.includes('drop shoulder')) {
        return (
          sub.includes('drop shoulder') ||
          sub.includes('drop-shoulder') ||
          cat.includes('drop shoulder') ||
          name.includes('drop shoulder') ||
          name.includes('drop-shoulder')
        );
      }

      // Polo T-Shirts
      if (catSlug === 'polo-t-shirts' || catName.includes('polo')) {
        return (
          sub.includes('polo') ||
          cat.includes('polo') ||
          name.includes('polo')
        );
      }

      // Generic Category Matching (for custom MongoDB categories)
      return (
        sub === catName ||
        sub.includes(catName) ||
        cat === catName ||
        cat.includes(catName) ||
        slugifyCategory(sub) === catSlug ||
        slugifyCategory(cat) === catSlug ||
        name.includes(catName)
      );
    });
  }, [products, currentCategory]);

  // Sort filtered products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-low') {
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === 'price-high') {
      return list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    }
    // 'newest' default
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filteredProducts, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* ── BREADCRUMBS & BACK BUTTON ───────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 flex-wrap">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            onClick={onNavigateHome}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Collections
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-extrabold">{currentCategory.label}</span>
        </div>

        {/* ── CATEGORY HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-900 text-white">
                Collection
              </span>
              <span className="text-xs font-bold text-slate-500">
                QuickFit Luxury Streetwear
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight">
              {currentCategory.label}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isLoadingProducts ? (
                <span>Syncing live inventory from database…</span>
              ) : (
                <span>
                  Showing <strong className="text-slate-900 font-bold">{sortedProducts.length}</strong> styles in this collection
                </span>
              )}
            </p>
          </div>

          {/* SORT CONTROLS */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer min-h-[40px]"
            >
              <option value="newest">🔥 Newest Arrivals</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ── QUICK CATEGORY SWITCHER TABS ────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => handleSelectCategorySlug('all')}
            className="px-4 sm:px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 min-h-[38px] bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200 cursor-pointer"
          >
            All Men's Fits
          </button>
          {allCategoryTabs.map((cat) => {
            const isActive = (currentCategory.slug || '').toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.slug}
                onClick={() => handleSelectCategorySlug(cat.slug)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 min-h-[38px] cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── PRODUCT GRID / STATES ───────────────────────────────────── */}
        {isLoadingProducts ? (
          /* 1. Loading Skeletons */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl sm:rounded-3xl p-3 border border-slate-200 space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-slate-200 rounded-xl w-full"></div>
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          /* 2. Error State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-slate-200 space-y-4 my-8">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-black text-slate-900 font-heading">Could Not Load Products</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{productsError}</p>
            <button
              onClick={() => fetchProducts()}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-black transition-colors cursor-pointer"
            >
              🔄 Retry
            </button>
          </div>
        ) : sortedProducts.length > 0 ? (
          /* 3. Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">
            {sortedProducts.map((product, index) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          /* 4. No Products in Category */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-slate-200 space-y-4 my-8">
            <div className="w-14 h-14 bg-slate-100 rounded-full text-slate-700 flex items-center justify-center mx-auto text-xl font-bold">
              🛍️
            </div>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              No {currentCategory.label} In Stock Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              We are updating our live inventory with fresh styles for this collection shortly.
            </p>
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-black transition-colors cursor-pointer"
            >
              View All Collections
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CategoryPage;
