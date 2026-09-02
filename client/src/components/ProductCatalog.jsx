import React from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';

export const ProductCatalog = () => {
  const {
    products,
    isLoadingProducts,
    isBackendWaking,
    productsError,
    fetchProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    user,
    nearbyStores,
    locationStatus
  } = useShop();

  const categoriesList = [
    { label: 'All Men', slug: 'All' },
    { label: 'Oversized T-Shirts', slug: 'Oversized T-Shirts' },
    { label: 'Drop Shoulder T-Shirts', slug: 'Drop Shoulder T-Shirts' },
    { label: 'Polo T-Shirts', slug: 'Polo T-Shirts' },
    { label: 'Shirts', slug: 'Shirts' }
  ];

  // Filter products based on search and category
  let filtered = products.filter((item) => {
    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      item.name?.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));

    // Category filter
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      const target = selectedCategory.trim().toLowerCase();
      const sub = (item.subcategory || '').trim().toLowerCase();
      const cat = (item.category || '').trim().toLowerCase();
      const name = (item.name || '').trim().toLowerCase();

      if (target === 'shirts' || target === 'linen shirts' || target === 'linen-shirts') {
        if (sub.includes('t-shirt') || sub.includes('tshirt') || cat.includes('t-shirt') || cat.includes('tshirt')) {
          matchesCategory = false;
        } else {
          matchesCategory = (
            sub === 'shirts' ||
            sub === 'linen shirts' ||
            sub === 'formal shirts' ||
            sub === 'pure linen' ||
            cat === 'shirts' ||
            (name.includes('shirt') && !name.includes('t-shirt') && !name.includes('tshirt'))
          );
        }
      } else if (target.includes('oversized')) {
        matchesCategory = sub.includes('oversized') || name.includes('oversized');
      } else if (target.includes('drop shoulder') || target.includes('dropshoulder')) {
        matchesCategory = sub.includes('drop shoulder') || sub.includes('dropshoulder') || name.includes('drop shoulder') || name.includes('dropshoulder');
      } else if (target.includes('polo')) {
        matchesCategory = sub.includes('polo') || name.includes('polo');
      } else {
        const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const selectedNorm = normalize(selectedCategory);
        const subNorm = normalize(item.subcategory);
        const catNorm = normalize(item.category);
        const nameNorm = normalize(item.name);

        matchesCategory =
          subNorm === selectedNorm ||
          catNorm === selectedNorm ||
          nameNorm === selectedNorm ||
          subNorm.includes(selectedNorm) ||
          nameNorm.includes(selectedNorm);
      }
    }

    return matchesSearch && matchesCategory;
  });

  // Sort logic
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // Newest default
  });

  // Diagnostic logs
  console.log(`[CATALOG] Total products in context: ${products.length}`);
  console.log(`[CATALOG] After filter (category="${selectedCategory}", search="${searchQuery}"): ${filtered.length} products`);
  console.log(`[CATALOG] Rendering ${filtered.length} product cards`);

  // ── Build store-grouped view when location is active ──────────────────────
  const isLocationActive = locationStatus === 'granted' && nearbyStores.length > 0;

  // Groups: [{ store: {...}, products: [...] }, ...] sorted by distanceKm
  const storeGroups = isLocationActive
    ? nearbyStores.map((store) => ({
        store,
        products: filtered.filter(
          (p) => (p.storeId?.toString() || '') === (store._id?.toString() || '')
        )
      })).filter((g) => g.products.length > 0)
    : [];


  return (
    <section id="catalog-section" className="py-12 sm:py-16 bg-slate-100/60 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* CATALOG HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1">
              MEN'S STREETWEAR CATALOG
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
              {selectedCategory === 'All' ? 'All Men\'s Fashion & Fits' : `${selectedCategory}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isLoadingProducts ? (
                <span>Syncing live inventory from database...</span>
              ) : (
                <span>Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> items in live inventory.</span>
              )}
            </p>
          </div>

          {/* SORT CONTROLS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer !min-h-[40px]"
            >
              <option value="newest">🔥 Newest Arrivals</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* MAIN CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 !min-h-[40px] ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 1. LOADING STATE */}
        {isLoadingProducts ? (
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
          /* 2. ERROR STATE — with context-aware messaging */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-slate-200 space-y-4 my-8">
            {isBackendWaking ? (
              /* Cold-start waking state */
              <>
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-2xl animate-pulse">
                  ☀️
                </div>
                <h3 className="text-lg font-black text-slate-900 font-heading">Server Starting Up…</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  The backend server was idle and is now waking up. This takes up to 30–60 seconds on first visit. Products will load automatically.
                </p>
                {/* Animated progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-1.5 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-1/2"></div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Retrying automatically… please wait</p>
              </>
            ) : (
              /* Hard connection error */
              <>
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-slate-900 font-heading">Could Not Load Products</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {productsError}
                </p>
                <button
                  onClick={() => fetchProducts()}
                  className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-black transition-colors"
                >
                  🔄 Retry
                </button>
              </>
            )}
          </div>
        ) : filtered.length > 0 ? (
          /* 3. PRODUCT GRID — Clean flat luxury catalog grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        ) : (
          /* 4. NO RESULTS EMPTY STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-slate-200 space-y-4 my-8">
            <div className="w-14 h-14 bg-slate-100 rounded-full text-slate-700 flex items-center justify-center mx-auto text-xl font-bold">
              🔍
            </div>
            <h3 className="text-lg font-black text-slate-900 font-heading">No Products Found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              No items matching your selection. Try resetting your search or filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-black transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* 5. TEMPORARY ADMIN DEBUG SECTION */}
        {user?.role === 'admin' && (
          <div className="mt-16 bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white shadow-2xl">
            <h3 className="text-lg font-black font-heading mb-4 text-amber-400 flex items-center gap-2">
              <span>🛠️</span> Admin Debug: Product Visibility Audit
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-800 text-slate-300 font-mono">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Product ID</th>
                    <th className="px-4 py-3">Store ID</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Active Status</th>
                    <th className="px-4 py-3 text-center">Visible on Website?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px] sm:text-xs">
                  {products.map(p => {
                    const isVisible = filtered.some(f => f._id === p._id || f.id === p.id);
                    return (
                      <tr key={p._id || p.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 max-w-[150px] truncate">{p.name}</td>
                        <td className="px-4 py-3 text-slate-400">{p._id || p.id}</td>
                        <td className="px-4 py-3 text-slate-400">{p.storeId || p.storeName || 'Legacy / Global'}</td>
                        <td className={`px-4 py-3 font-bold ${p.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.stockQuantity}
                        </td>
                        <td className="px-4 py-3">
                          {p.inStock ? <span className="text-emerald-400">In Stock</span> : <span className="text-rose-400">Out of Stock</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isVisible ? (
                            <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">YES</span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-rose-500/20 text-rose-400 rounded">NO (Filtered)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                        No products loaded in context.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              Note: This table shows ALL products fetched by the frontend. If a product is not in this list, it was either excluded by the backend (e.g. wrong storeId) or doesn't exist. "Visible on Website" means it passed all frontend filters (category/search).
            </p>
          </div>
        )}

      </div>
    </section>
  );
};
