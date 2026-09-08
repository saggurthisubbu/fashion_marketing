import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';

export const SearchResultsPage = ({ queryParam, onNavigateHome }) => {
  const {
    API_BASE_URL,
    resolveImageUrl,
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    openProductDetail,
    user,
  } = useShop();

  // Search query from URL or prop
  const [searchQuery, setSearchQuery] = useState(queryParam || '');
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic filter facets from backend
  const [facets, setFacets] = useState({
    categories: [],
    subcategories: [],
    minPrice: 0,
    maxPrice: 3000,
    stores: [],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  });

  // Filter states
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onlyNewArrivals, setOnlyNewArrivals] = useState(false);
  const [onlyBestSellers, setOnlyBestSellers] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Mobile filters drawer open state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Recommended products for empty state
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Popular search tags for empty state
  const popularTags = [
    'Oversized T-Shirts',
    'Drop Shoulder',
    'Linen Shirts',
    'Polo T-Shirts',
    'Graphic Tees',
    'Streetwear',
    'Black Fits',
  ];

  const colorOptions = [
    { name: 'Black', hex: '#0f172a' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Olive', hex: '#3f6212' },
    { name: 'Beige', hex: '#d4b996' },
    { name: 'Brown', hex: '#78350f' },
    { name: 'Grey', hex: '#64748b' },
  ];

  // Sync searchQuery when prop changes
  useEffect(() => {
    if (queryParam !== undefined) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Main search API request
  const fetchSearchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        q: searchQuery,
        sort: sortBy,
      };

      if (selectedSubcategories.length > 0) {
        params.subcategory = selectedSubcategories.join(',');
      }
      if (priceRange.min > 0) params.minPrice = priceRange.min;
      if (priceRange.max < 5000) params.maxPrice = priceRange.max;
      if (selectedSizes.length > 0) params.sizes = selectedSizes.join(',');
      if (selectedColors.length > 0) params.colors = selectedColors.join(',');
      if (selectedStores.length > 0) params.storeName = selectedStores[0]; // Primary selected store
      if (inStockOnly) params.inStock = 'true';
      if (onlyNewArrivals) params.isNewArrival = 'true';
      if (onlyBestSellers) params.isBestSeller = 'true';

      const res = await axios.get(`${API_BASE_URL}/search/results`, { params });

      if (res.data) {
        setProducts(res.data.products || []);
        setTotalCount(res.data.total || 0);
        if (res.data.facets) {
          setFacets((prev) => ({
            ...prev,
            ...res.data.facets,
          }));
        }
      }
    } catch (err) {
      console.error('Search results error:', err.message);
      setError('Unable to load search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    API_BASE_URL,
    searchQuery,
    sortBy,
    selectedSubcategories,
    priceRange,
    selectedSizes,
    selectedColors,
    selectedStores,
    inStockOnly,
    onlyNewArrivals,
    onlyBestSellers,
  ]);

  // Fetch recommended items for fallback/empty state
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products`, {
          params: { limit: 8 },
        });
        if (res.data && Array.isArray(res.data)) {
          setRecommendedProducts(res.data.slice(0, 8));
        }
      } catch (e) {
        // Ignore
      }
    };
    fetchRecommended();
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Filter helper functions
  const toggleSubcategory = (subcat) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
    );
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleStore = (store) => {
    setSelectedStores((prev) =>
      prev.includes(store) ? prev.filter((st) => st !== store) : [...prev, store]
    );
  };

  const clearAllFilters = () => {
    setSelectedSubcategories([]);
    setPriceRange({ min: 0, max: 5000 });
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedStores([]);
    setInStockOnly(false);
    setOnlyNewArrivals(false);
    setOnlyBestSellers(false);
    setSortBy('relevance');
  };

  const hasActiveFilters =
    selectedSubcategories.length > 0 ||
    priceRange.min > 0 ||
    priceRange.max < 5000 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedStores.length > 0 ||
    inStockOnly ||
    onlyNewArrivals ||
    onlyBestSellers;

  // Active filter pills count
  const activeFiltersCount =
    selectedSubcategories.length +
    selectedSizes.length +
    selectedColors.length +
    selectedStores.length +
    (inStockOnly ? 1 : 0) +
    (onlyNewArrivals ? 1 : 0) +
    (onlyBestSellers ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 5000 ? 1 : 0);

  // New search term execution from this page
  const handleInlineSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    window.history.pushState({ modal: 'search', q: searchQuery.trim() }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const executeTagSearch = (tag) => {
    setSearchQuery(tag);
    const url = `/search?q=${encodeURIComponent(tag)}`;
    window.history.pushState({ modal: 'search', q: tag }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STICKY SEARCH HEADER BAR                                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* BREADCRUMB & QUERY TITLE */}
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateHome}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Home</span>
              </button>
              <span className="text-slate-300">/</span>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Results for</span>
                  <span className="text-amber-600 underline decoration-amber-300">
                    "{searchQuery || 'All Products'}"
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {isLoading ? 'Searching catalog...' : `${totalCount} ${totalCount === 1 ? 'fit' : 'fits'} found`}
                </p>
              </div>
            </div>

            {/* SORTING & FILTER BUTTON BAR */}
            <div className="flex items-center gap-2.5 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">

              {/* Mobile Filters Toggle Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>⚙️ Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* SORT DROPDOWN (AMAZON/MYNTRA STYLE) */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 hidden sm:inline">
                  Sort By:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">✦ Relevance (Featured)</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Customer Rating</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>

            </div>

          </div>

          {/* ACTIVE FILTER CHIPS BAR */}
          {hasActiveFilters && (
            <div className="flex items-center flex-wrap gap-2 pt-2.5 mt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Active:</span>

              {selectedSubcategories.map((subcat) => (
                <span
                  key={subcat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold"
                >
                  <span>{subcat}</span>
                  <button onClick={() => toggleSubcategory(subcat)} className="text-white/70 hover:text-white">✕</button>
                </span>
              ))}

              {selectedSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold"
                >
                  <span>Size: {size}</span>
                  <button onClick={() => toggleSize(size)} className="text-white/70 hover:text-white">✕</button>
                </span>
              ))}

              {selectedColors.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold"
                >
                  <span>Color: {color}</span>
                  <button onClick={() => toggleColor(color)} className="text-white/70 hover:text-white">✕</button>
                </span>
              ))}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  <span>In Stock Only</span>
                  <button onClick={() => setInStockOnly(false)} className="text-white/70 hover:text-white">✕</button>
                </span>
              )}

              {onlyNewArrivals && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-900 text-[11px] font-black">
                  <span>New Arrivals</span>
                  <button onClick={() => setOnlyNewArrivals(false)} className="text-slate-900/70 hover:text-slate-900">✕</button>
                </span>
              )}

              {onlyBestSellers && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-900 text-[11px] font-black">
                  <span>Best Sellers</span>
                  <button onClick={() => setOnlyBestSellers(false)} className="text-slate-900/70 hover:text-slate-900">✕</button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[11px] font-black text-rose-600 hover:text-rose-700 hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MAIN TWO-COLUMN LAYOUT: (SIDEBAR FILTERS + PRODUCT GRID)          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-8 items-start">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* DESKTOP FILTER SIDEBAR                                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-36 space-y-6 flex-shrink-0 max-h-[80vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>⚡</span>
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] font-black text-rose-500 hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* 1. SUBCATEGORIES */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Fit & Category
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[
                  'Oversized T-Shirts',
                  'Drop Shoulder T-Shirts',
                  'Polo T-Shirts',
                  'Shirts',
                  'Streetwear',
                ].map((cat) => {
                  const isChecked = selectedSubcategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubcategory(cat)}
                          className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                        />
                        <span className={isChecked ? 'text-slate-900 font-black' : ''}>{cat}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. PRICE BRACKETS */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Price Range
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'All Prices', min: 0, max: 5000 },
                  { label: 'Under ₹500', min: 0, max: 499 },
                  { label: '₹500 - ₹999', min: 500, max: 999 },
                  { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
                  { label: '₹2,000 & Above', min: 2000, max: 5000 },
                ].map((bracket) => {
                  const isSelected =
                    priceRange.min === bracket.min && priceRange.max === bracket.max;
                  return (
                    <label
                      key={bracket.label}
                      className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="price_bracket"
                        checked={isSelected}
                        onChange={() => setPriceRange({ min: bracket.min, max: bracket.max })}
                        className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      />
                      <span className={isSelected ? 'text-slate-900 font-black' : ''}>
                        {bracket.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. SIZES */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Size
              </div>
              <div className="flex flex-wrap gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. COLORS */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Color
              </div>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => {
                  const isSelected = selectedColors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleColor(c.name)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                        c.border ? 'border border-slate-300' : ''
                      } ${isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <span className={c.name === 'White' ? 'text-slate-900 text-xs font-black' : 'text-white text-xs font-black'}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. AVAILABILITY & SPECIAL TAGS */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Preferences
              </div>

              <label className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                <span>In Stock Only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                <span>⚡ New Arrivals</span>
                <input
                  type="checkbox"
                  checked={onlyNewArrivals}
                  onChange={(e) => setOnlyNewArrivals(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                <span>🔥 Best Sellers</span>
                <input
                  type="checkbox"
                  checked={onlyBestSellers}
                  onChange={(e) => setOnlyBestSellers(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

          </aside>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PRODUCT RESULTS GRID                                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {isLoading ? (
              /* LOADING SKELETON GRID */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-3 border border-slate-200 animate-pulse space-y-3">
                    <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-8 bg-slate-200 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              /* ERROR STATE */
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-200 shadow-sm space-y-4">
                <div className="text-4xl">⚠️</div>
                <h3 className="text-base font-black text-slate-900">{error}</h3>
                <button
                  onClick={fetchSearchResults}
                  className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black hover:bg-black transition-colors"
                >
                  Retry Search
                </button>
              </div>
            ) : products.length > 0 ? (
              /* PRODUCTS FOUND (AMAZON / MYNTRA CARDS) */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {products.map((product) => {
                  const img = resolveImageUrl(product.image || product.images?.front);
                  const isWishlisted = isInWishlist(product.id || product._id);
                  const discountPct = product.discount || (
                    product.originalPrice && product.originalPrice > product.price
                      ? `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`
                      : null
                  );

                  return (
                    <div
                      key={product._id || product.id}
                      className="group relative bg-white rounded-3xl p-2.5 sm:p-3.5 border border-slate-200/80 hover:border-slate-900 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* TOP BADGE & WISHLIST BUTTON */}
                      <div className="relative w-full aspect-[4/5] rounded-2xl bg-slate-100 overflow-hidden mb-3">
                        <img
                          src={img}
                          alt={product.name}
                          onClick={() => openProductDetail(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600';
                          }}
                        />

                        {/* BADGES */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                          {product.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                              {product.badge}
                            </span>
                          )}
                          {discountPct && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs">
                              {discountPct}
                            </span>
                          )}
                        </div>

                        {/* WISHLIST BUTTON */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-500 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="Wishlist"
                        >
                          <span className={isWishlisted ? 'text-rose-500 font-black' : 'text-slate-400'}>
                            {isWishlisted ? '❤️' : '🤍'}
                          </span>
                        </button>

                        {/* EXPRESS DELIVERY BANNER */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2 text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>⚡ 60-min Express</span>
                        </div>
                      </div>

                      {/* PRODUCT INFO */}
                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[120px] font-bold">
                              {product.storeName || 'QuickFit Hub'}
                            </span>
                            <span className="text-amber-500 font-black">★ {product.rating || 4.9}</span>
                          </div>

                          <h3
                            onClick={() => openProductDetail(product)}
                            className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors cursor-pointer mt-0.5"
                          >
                            {product.name}
                          </h3>

                          <p className="text-[10px] text-slate-500 truncate">
                            {product.subcategory || product.category}
                          </p>
                        </div>

                        {/* PRICING */}
                        <div className="pt-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-black text-slate-900">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>

                          {/* ACTION BUTTONS (ADD TO BAG & BUY NOW) */}
                          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                            <button
                              onClick={() => addToCart(product, product.sizes?.[0] || 'M')}
                              className="py-2 px-2 rounded-xl border border-slate-200 hover:border-slate-900 bg-slate-50 hover:bg-white text-slate-900 text-[10px] sm:text-xs font-black transition-all text-center truncate cursor-pointer active:scale-95"
                            >
                              Add to Bag
                            </button>
                            <button
                              onClick={() => buyNow(product, product.sizes?.[0] || 'M')}
                              className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] sm:text-xs font-black transition-all text-center truncate cursor-pointer active:scale-95"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* ───────────────────────────────────────────────────────── */
              /* NO PRODUCTS FOUND STATE (AMAZON / FLIPKART STYLE)         */
              /* ───────────────────────────────────────────────────────── */
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-8">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto">
                    🔍
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    No products matched "{searchQuery}"
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Check your spelling, clear any applied filters, or browse our recommended trending categories below.
                  </p>

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black hover:bg-black transition-all shadow-md cursor-pointer"
                    >
                      Clear Filters & Show All
                    </button>
                  )}
                </div>

                {/* POPULAR SEARCHES PILLS */}
                <div className="space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Try Searching For
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => executeTagSearch(tag)}
                        className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-all hover:scale-105 cursor-pointer"
                      >
                        ⚡ {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RECOMMENDED PRODUCTS CAROUSEL */}
                {recommendedProducts.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-slate-100 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900">
                        Popular Fits You Might Like
                      </h3>
                      <span className="text-xs font-bold text-amber-600">Bestsellers</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {recommendedProducts.slice(0, 4).map((rec) => {
                        const recImg = resolveImageUrl(rec.image || rec.images?.front);
                        return (
                          <div
                            key={rec._id || rec.id}
                            onClick={() => openProductDetail(rec)}
                            className="bg-slate-50 hover:bg-white rounded-2xl p-2.5 border border-slate-200/80 hover:border-slate-900 transition-all cursor-pointer group"
                          >
                            <div className="w-full aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden mb-2">
                              <img
                                src={recImg}
                                alt={rec.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                              {rec.name}
                            </h4>
                            <p className="text-xs font-black text-slate-900 mt-1">₹{rec.price}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MOBILE FILTER BOTTOM SHEET DRAWER                                 */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* DRAWER HEADER */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>⚙️</span>
                <span>Filters & Refinements</span>
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="p-5 overflow-y-auto space-y-6">

              {/* SUBCATEGORIES */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase text-slate-400">Fit & Category</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Oversized T-Shirts',
                    'Drop Shoulder T-Shirts',
                    'Polo T-Shirts',
                    'Shirts',
                  ].map((cat) => {
                    const isChecked = selectedSubcategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleSubcategory(cat)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                          isChecked
                            ? 'bg-slate-900 text-white font-black'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SIZES */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase text-slate-400">Size</div>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                    const isSelected = selectedSizes.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`w-10 h-10 rounded-xl text-xs font-black ${
                          isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRICE */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase text-slate-400">Price Range</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'All Prices', min: 0, max: 5000 },
                    { label: 'Under ₹500', min: 0, max: 499 },
                    { label: '₹500 - ₹999', min: 500, max: 999 },
                    { label: '₹1,000+', min: 1000, max: 5000 },
                  ].map((b) => {
                    const isSelected = priceRange.min === b.min && priceRange.max === b.max;
                    return (
                      <button
                        key={b.label}
                        onClick={() => setPriceRange({ min: b.min, max: b.max })}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left ${
                          isSelected ? 'bg-slate-900 text-white font-black' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* DRAWER FOOTER ACTIONS */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => {
                  clearAllFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-700"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-black shadow-md"
              >
                Apply ({products.length} Fits)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SearchResultsPage;
