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
    user
  } = useShop();

  const categoriesList = [
    { label: 'All', slug: 'All' },
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

      if (target === 'shirts' || target === 'linen shirts') {
        if (sub.includes('t-shirt') || sub.includes('tshirt') || cat.includes('t-shirt') || cat.includes('tshirt')) {
          matchesCategory = false;
        } else {
          matchesCategory = (
            sub.includes('shirt') ||
            cat.includes('shirt') ||
            (name.includes('shirt') && !name.includes('t-shirt') && !name.includes('tshirt'))
          );
        }
      } else if (target.includes('oversized')) {
        matchesCategory = sub.includes('oversized') || name.includes('oversized') || cat.includes('oversized');
      } else if (target.includes('drop shoulder') || target.includes('dropshoulder')) {
        matchesCategory = sub.includes('drop shoulder') || sub.includes('dropshoulder') || name.includes('drop shoulder') || name.includes('dropshoulder');
      } else if (target.includes('polo')) {
        matchesCategory = sub.includes('polo') || name.includes('polo') || cat.includes('polo');
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

  return (
    <section id="catalog-section" className="py-10 sm:py-16 bg-neutral-50/50 min-h-screen border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* CATALOG HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
              QUICKFIT MEN'S WEAR
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-neutral-950 tracking-tight">
              {selectedCategory === 'All' ? "Men's Collection" : `${selectedCategory}`}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              {isLoadingProducts ? (
                <span>Loading products from database...</span>
              ) : (
                <span>Showing <strong className="text-black font-bold">{filtered.length}</strong> items.</span>
              )}
            </p>
          </div>

          {/* SORT CONTROLS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-black cursor-pointer !min-h-[40px]"
            >
              <option value="newest">🔥 Newest Arrivals</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* MAIN CATEGORY TABS (BLACK & WHITE) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 !min-h-[38px] cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black border border-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 1. LOADING SKELETON STATE */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl sm:rounded-3xl p-3 border border-neutral-200 space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-neutral-200 rounded-xl w-full"></div>
                <div className="h-4 bg-neutral-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded-md w-1/2"></div>
                <div className="h-9 bg-neutral-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          /* 2. ERROR STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-neutral-200 space-y-4 my-8">
            {isBackendWaking ? (
              <>
                <div className="w-14 h-14 bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
                  ⚡
                </div>
                <h3 className="text-lg font-black text-neutral-900 font-heading">Connecting to Database...</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Connecting to cloud database. Products will appear shortly.
                </p>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-neutral-900 h-1.5 rounded-full animate-pulse w-2/3"></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-neutral-900 font-heading">Could Not Load Products</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {productsError}
                </p>
                <button
                  onClick={() => fetchProducts(null)}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-black text-xs shadow-md hover:bg-neutral-800 transition-colors"
                >
                  🔄 Retry
                </button>
              </>
            )}
          </div>
        ) : filtered.length > 0 ? (
          /* 3. PRODUCT GRID — Strict equal height & aspect ratio cards */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        ) : (
          /* 4. EMPTY STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-neutral-200 space-y-4 my-8">
            <div className="w-14 h-14 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              🔍
            </div>
            <h3 className="text-lg font-black text-neutral-900 font-heading">No Products Found</h3>
            <p className="text-xs text-neutral-500">
              No items matching this selection. Try selecting "All" or resetting your search.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-black text-white font-black text-xs shadow-md hover:bg-neutral-800 transition-colors"
            >
              Show All Products
            </button>
          </div>
        )}

        {/* 5. COLLAPSIBLE ADMIN AUDIT (CLEAN FOR MOBILE) */}
        {user?.role === 'admin' && (
          <details className="mt-16 bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-neutral-800 text-white shadow-xl">
            <summary className="text-xs sm:text-sm font-black font-heading text-neutral-300 cursor-pointer select-none">
              🛠️ Admin Visibility Audit ({products.length} total products in database)
            </summary>
            <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-700">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-neutral-800 text-neutral-300 font-mono">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-center">In Catalog?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono text-[11px]">
                  {products.map(p => {
                    const isVisible = filtered.some(f => (f._id || f.id) === (p._id || p.id));
                    return (
                      <tr key={p._id || p.id} className="hover:bg-neutral-800/50">
                        <td className="px-4 py-2.5 max-w-[150px] truncate">{p.name}</td>
                        <td className="px-4 py-2.5 text-neutral-400">{p._id || p.id}</td>
                        <td className="px-4 py-2.5 text-neutral-400">{p.subcategory || p.category}</td>
                        <td className="px-4 py-2.5 text-neutral-300">{p.stockQuantity}</td>
                        <td className="px-4 py-2.5 text-center">
                          {isVisible ? (
                            <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-bold">YES</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded font-bold">FILTERED</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

      </div>
    </section>
  );
};

export default ProductCatalog;
