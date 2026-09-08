import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useShop } from '../../context/ShopContext';

// Helper to highlight matching text
const HighlightMatch = ({ text = '', query = '' }) => {
  if (!query) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-black text-slate-900 bg-amber-100 px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const SearchOverlayModal = ({ isOpen, onClose, initialQuery = '' }) => {
  const { API_BASE_URL, resolveImageUrl, user, openProductDetail, products: globalProducts } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([
    'Oversized T-Shirts',
    'Drop Shoulder',
    'Linen Shirts',
    'Polo T-Shirts',
    'Graphic Tees',
    'Black Streetwear',
    'Summer Fits',
  ]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [liveSuggestions, setLiveSuggestions] = useState({
    suggestions: [],
    categories: [],
    products: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Load Recent Searches from localStorage on mount
  const loadLocalRecentSearches = useCallback(() => {
    try {
      const saved = localStorage.getItem('quickfit_recent_searches');
      if (saved) {
        return JSON.parse(saved).slice(0, 10);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, []);

  // Sync / Fetch history from backend
  const fetchSearchHistory = useCallback(async () => {
    const local = loadLocalRecentSearches();
    setRecentSearches(local);

    try {
      const params = {};
      if (user?._id || user?.id) params.userId = user._id || user.id;
      if (user?.email) params.email = user.email;

      const res = await axios.get(`${API_BASE_URL}/search/history`, { params });
      if (res.data) {
        if (res.data.recent && res.data.recent.length > 0) {
          // Merge local and remote uniquely
          const merged = Array.from(new Set([...local, ...res.data.recent])).slice(0, 10);
          setRecentSearches(merged);
          localStorage.setItem('quickfit_recent_searches', JSON.stringify(merged));
        }
        if (res.data.trending && res.data.trending.length > 0) {
          setTrendingSearches(res.data.trending);
        }
        if (res.data.recommended && res.data.recommended.length > 0) {
          setRecommendedProducts(res.data.recommended);
        }
      }
    } catch (err) {
      console.warn('Could not fetch search history from API:', err.message);
    }
  }, [API_BASE_URL, user, loadLocalRecentSearches]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery || '');
      fetchSearchHistory();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, initialQuery, fetchSearchHistory]);

  // Fallback recommended products from globalProducts if API is empty
  useEffect(() => {
    if (recommendedProducts.length === 0 && globalProducts && globalProducts.length > 0) {
      setRecommendedProducts(globalProducts.slice(0, 8));
    }
  }, [recommendedProducts, globalProducts]);

  // Live search debouncer
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setLiveSuggestions({ suggestions: [], categories: [], products: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/search/suggestions`, {
          params: { q },
        });
        if (res.data) {
          setLiveSuggestions({
            suggestions: res.data.suggestions || [],
            categories: res.data.categories || [],
            products: res.data.products || [],
          });
        }
      } catch (err) {
        // Fallback to in-memory matching if offline
        if (globalProducts && globalProducts.length > 0) {
          const lower = q.toLowerCase();
          const matched = globalProducts.filter(
            (p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.category?.toLowerCase().includes(lower) ||
              p.subcategory?.toLowerCase().includes(lower)
          );
          setLiveSuggestions({
            suggestions: matched.map((m) => m.name).slice(0, 5),
            categories: Array.from(new Set(matched.map((m) => m.subcategory).filter(Boolean))).slice(0, 3),
            products: matched.slice(0, 5),
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, API_BASE_URL, globalProducts]);

  // Save search query to history (localStorage + MongoDB)
  const saveSearchTerm = useCallback(
    async (term) => {
      const clean = term.trim();
      if (!clean) return;

      // Update local state and localStorage
      setRecentSearches((prev) => {
        const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
        try {
          localStorage.setItem('quickfit_recent_searches', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      // Async save to MongoDB
      try {
        await axios.post(`${API_BASE_URL}/search/history`, {
          query: clean,
          userId: user?._id || user?.id || null,
          email: user?.email || null,
        });
      } catch (e) {
        // Non-blocking
      }
    },
    [API_BASE_URL, user]
  );

  // Navigate to Search Results Page
  const executeSearch = (term) => {
    const clean = (term || searchQuery).trim();
    if (!clean) return;

    saveSearchTerm(clean);
    onClose();

    // Trigger URL pushState to /search?q=...
    const searchUrl = `/search?q=${encodeURIComponent(clean)}`;
    window.history.pushState({ modal: 'search', q: clean }, '', searchUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Delete a single recent search term
  const handleDeleteRecent = async (e, termToDelete) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== termToDelete);
    setRecentSearches(updated);
    try {
      localStorage.setItem('quickfit_recent_searches', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    try {
      const params = {};
      if (user?._id || user?.id) params.userId = user._id || user.id;
      if (user?.email) params.email = user.email;
      await axios.delete(`${API_BASE_URL}/search/history/${encodeURIComponent(termToDelete)}`, { params });
    } catch (err) {
      // Ignore
    }
  };

  // Clear all recent searches
  const handleClearAllRecent = async (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('quickfit_recent_searches');
    } catch (err) {
      console.error(err);
    }

    try {
      const params = {};
      if (user?._id || user?.id) params.userId = user._id || user.id;
      if (user?.email) params.email = user.email;
      await axios.delete(`${API_BASE_URL}/search/history`, { params });
    } catch (err) {
      // Ignore
    }
  };

  // Keyboard navigation / ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasLiveResults =
    liveSuggestions.suggestions.length > 0 ||
    liveSuggestions.categories.length > 0 ||
    liveSuggestions.products.length > 0;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center animate-in fade-in duration-200">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* SEARCH CONTAINER (Full-Screen on Mobile, Floating Dropdown Container on Desktop) */}
      <div className="relative w-full max-w-3xl md:mt-16 bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[85vh] z-10 border border-slate-200">

        {/* TOP GOLD ACCENT */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 40%, #DAA520 70%, #B8860B 100%)' }} />

        {/* SEARCH HEADER BAR */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={onClose}
            className="md:hidden w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors flex-shrink-0"
            aria-label="Back"
          >
            ←
          </button>

          {/* Search Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className="flex-1 relative flex items-center"
          >
            <div className="absolute left-3.5 text-slate-400 text-sm">🔍</div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search oversized, drop shoulder, polo shirts, stores..."
              className="w-full pl-10 pr-20 py-3 rounded-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-inner"
            />

            {/* Right Action Icons in Input (Clear & Search Submit) */}
            <div className="absolute right-2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-all"
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center text-xs font-black shadow transition-all"
                title="Search"
              >
                ➔
              </button>
            </div>
          </form>

          {/* Desktop Close Icon */}
          <button
            onClick={onClose}
            className="hidden md:flex w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 items-center justify-center text-sm font-black transition-colors flex-shrink-0"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* SEARCH CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 divide-y divide-slate-100">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SCENARIO A: LIVE SEARCH AS USER IS TYPING                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-5">

              {isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-1">
                  <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Searching collections...</span>
                </div>
              )}

              {/* 1. KEYWORD & CATEGORY SUGGESTIONS */}
              {(liveSuggestions.suggestions.length > 0 || liveSuggestions.categories.length > 0) && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Search Suggestions
                  </div>
                  <div className="space-y-1">
                    {/* Category Direct Links */}
                    {liveSuggestions.categories.map((cat, idx) => (
                      <div
                        key={`cat-${idx}`}
                        onClick={() => executeSearch(cat)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer text-xs font-bold text-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-amber-500 text-sm">✦</span>
                          <span>
                            Search in <span className="text-amber-700 underline font-black">{cat}</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          Category
                        </span>
                      </div>
                    ))}

                    {/* Term Suggestions */}
                    {liveSuggestions.suggestions.map((suggestion, idx) => (
                      <div
                        key={`sug-${idx}`}
                        onClick={() => executeSearch(suggestion)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 group-hover:text-slate-900 transition-colors text-xs">🔍</span>
                          <HighlightMatch text={suggestion} query={searchQuery} />
                        </div>
                        <span className="text-slate-300 group-hover:text-slate-600 text-xs transition-colors">➔</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. INSTANT PRODUCT MATCH CARDS */}
              {liveSuggestions.products.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Matching Fits
                    </span>
                    <button
                      onClick={() => executeSearch(searchQuery)}
                      className="text-xs font-black text-slate-900 hover:text-amber-600 underline transition-colors cursor-pointer"
                    >
                      View All Results ➔
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {liveSuggestions.products.map((product) => {
                      const img = resolveImageUrl(product.image || product.images?.front);
                      return (
                        <div
                          key={product._id || product.id}
                          onClick={() => {
                            onClose();
                            openProductDetail(product);
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200/80 hover:border-slate-900 bg-white hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="w-14 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                            <img
                              src={img}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600';
                              }}
                            />
                            {product.discount && (
                              <span className="absolute bottom-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1 rounded">
                                {product.discount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                              <HighlightMatch text={product.name} query={searchQuery} />
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {product.subcategory || product.category} • {product.storeName || 'QuickFit Store'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-black text-slate-900">₹{product.price}</span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[10px] text-slate-400 line-through">₹{product.originalPrice}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW ALL RESULTS CTA BUTTON */}
              <div className="pt-2">
                <button
                  onClick={() => executeSearch(searchQuery)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <span>See all matching results for "{searchQuery}"</span>
                  <span>➔</span>
                </button>
              </div>

              {/* NO MATCHES FALLBACK WHILE TYPING */}
              {!isLoading && !hasLiveResults && (
                <div className="text-center py-8 space-y-3">
                  <div className="text-3xl">🔍</div>
                  <h3 className="text-sm font-black text-slate-800">No instant results for "{searchQuery}"</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Press Enter or click below to search our full catalog with multi-faceted filters.
                  </p>
                  <button
                    onClick={() => executeSearch(searchQuery)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-black transition-colors"
                  >
                    Search Full Catalog ➔
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* SCENARIO B: DEFAULT OPEN STATE (EMPTY SEARCH BAR)             */
            /* ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">

              {/* 1. RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>🕒</span>
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => executeSearch(term)}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-all active:scale-95"
                      >
                        <span className="text-slate-400 text-[10px]">🕒</span>
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRecent(e, term)}
                          className="w-3.5 h-3.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center text-[9px] font-black transition-colors ml-0.5"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. POPULAR & TRENDING SEARCHES */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>🔥</span>
                  <span>Popular Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeSearch(tag)}
                      className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-black text-amber-900 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="text-amber-500 text-xs">⚡</span>
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. RECOMMENDED PRODUCTS (FROM NEARBY STORES / BESTSELLERS) */}
              {recommendedProducts.length > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>✦</span>
                      <span>Trending Fits Near You</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      60-min Express Available
                    </span>
                  </div>

                  {/* Horizontal Scrollable Carousel */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {recommendedProducts.map((prod) => {
                      const img = resolveImageUrl(prod.image || prod.images?.front);
                      return (
                        <div
                          key={prod._id || prod.id}
                          onClick={() => {
                            onClose();
                            openProductDetail(prod);
                          }}
                          className="w-36 flex-shrink-0 bg-slate-50 hover:bg-white rounded-2xl p-2 border border-slate-200/80 hover:border-slate-900 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="w-full aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden relative mb-2">
                            <img
                              src={img}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400';
                              }}
                            />
                            {prod.badge && (
                              <span className="absolute top-1.5 left-1.5 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <h5 className="text-[11px] font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                            {prod.name}
                          </h5>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">
                            {prod.storeName || 'QuickFit Store'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-black text-slate-900">₹{prod.price}</span>
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="text-[9px] text-slate-400 line-through">₹{prod.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* BOTTOM HELPER FOOTER */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>⚡ QuickFit Smart Search</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-700">Enter</kbd> to view full results</span>
          </div>
          <button
            onClick={() => executeSearch('All')}
            className="font-bold text-slate-700 hover:text-slate-900 hover:underline"
          >
            Explore All Fits ➔
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchOverlayModal;
