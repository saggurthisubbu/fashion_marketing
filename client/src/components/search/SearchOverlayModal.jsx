import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useShop } from '../../context/ShopContext';

export const SearchOverlayModal = ({ isOpen, onClose, initialQuery = '' }) => {
  const { API_BASE_URL, resolveImageUrl, openProductDetail, addToCart, buyNow, products: globalProducts } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 60);
    }
  }, [isOpen, initialQuery]);

  // Query live matching real products as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      // If query is empty, show latest / featured products from store
      if (globalProducts && globalProducts.length > 0) {
        setMatchedProducts(globalProducts.slice(0, 10));
      } else {
        setMatchedProducts([]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/search/suggestions`, {
          params: { q },
        });
        if (res.data && Array.isArray(res.data.products)) {
          setMatchedProducts(res.data.products);
        }
      } catch (err) {
        // Fallback to client-side in-memory search across global products
        if (globalProducts && globalProducts.length > 0) {
          const lower = q.toLowerCase();
          const localMatched = globalProducts.filter(
            (p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.category?.toLowerCase().includes(lower) ||
              p.subcategory?.toLowerCase().includes(lower) ||
              p.storeName?.toLowerCase().includes(lower) ||
              p.description?.toLowerCase().includes(lower)
          );
          setMatchedProducts(localMatched.slice(0, 10));
        }
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, API_BASE_URL, globalProducts]);

  // Execute full search and navigate to /search?q=...
  const executeSearch = (term) => {
    const clean = (term !== undefined ? term : searchQuery).trim();
    if (!clean) return;

    onClose();
    const searchUrl = `/search?q=${encodeURIComponent(clean)}`;
    window.history.pushState({ modal: 'search', q: clean }, '', searchUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Keyboard navigation & ESC handler
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

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center animate-in fade-in duration-200">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* SEARCH CONTAINER (Responsive: Full-width on mobile, floating card on desktop) */}
      <div className="relative w-full max-w-4xl h-full md:h-auto md:max-h-[88vh] md:mt-12 bg-white md:rounded-3xl shadow-2xl flex flex-col z-10 border border-slate-200 overflow-hidden">
        {/* GOLD ACCENT BAR */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 40%, #DAA520 70%, #B8860B 100%)' }} />

        {/* SEARCH HEADER BAR (Mobile-first, responsive, perfectly aligned) */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex items-center gap-2 sm:gap-3">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base flex-shrink-0 transition-colors cursor-pointer"
            aria-label="Back"
          >
            ←
          </button>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className="flex-1 relative flex items-center min-w-0"
          >
            <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for shirts, oversized, polo..."
              className="w-full pl-10 pr-20 py-2.5 sm:py-3 rounded-full bg-slate-100 focus:bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-inner"
            />

            {/* Clear & Submit Action Buttons */}
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center text-xs font-black shadow transition-all cursor-pointer active:scale-95"
                title="Search"
              >
                ➔
              </button>
            </div>
          </form>

          {/* Desktop Close Icon */}
          <button
            onClick={onClose}
            className="hidden md:flex w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 items-center justify-center text-sm font-black transition-colors flex-shrink-0 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* SEARCH RESULTS HEADER & ACTION */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 truncate">
            {searchQuery.trim()
              ? `Real Products Matching "${searchQuery.trim()}" (${matchedProducts.length})`
              : `Featured Fits (${matchedProducts.length})`}
          </span>
          {searchQuery.trim() && (
            <button
              onClick={() => executeSearch()}
              className="font-black text-slate-900 hover:text-amber-600 underline flex items-center gap-1 cursor-pointer flex-shrink-0 ml-2"
            >
              <span>View Full Results Page</span>
              <span>➔</span>
            </button>
          )}
        </div>

        {/* REAL PRODUCTS GRID BODY (NO SUGGESTION LISTS / NO AUTOCOMPLETE CHIPS) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 animate-pulse space-y-2">
                  <div className="w-full aspect-[4/5] bg-slate-200 rounded-xl" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : matchedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {matchedProducts.map((product) => {
                const img = resolveImageUrl(product.image || product.images?.front);
                const discountPct =
                  product.discount ||
                  (product.originalPrice && product.originalPrice > product.price
                    ? `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`
                    : null);

                return (
                  <div
                    key={product._id || product.id}
                    className="bg-white rounded-2xl p-2.5 border border-slate-200/90 hover:border-slate-900 hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    {/* PRODUCT IMAGE */}
                    <div
                      onClick={() => {
                        onClose();
                        openProductDetail(product);
                      }}
                      className="relative w-full aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden mb-2 cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600';
                        }}
                      />
                      {discountPct && (
                        <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">
                          {discountPct}
                        </span>
                      )}
                      {product.badge && (
                        <span className="absolute top-1.5 right-1.5 bg-slate-900/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                          <span className="truncate font-bold">{product.storeName || 'QuickFit Store'}</span>
                          <span className="text-amber-500 font-black">★ {product.rating || 4.9}</span>
                        </div>
                        <h4
                          onClick={() => {
                            onClose();
                            openProductDetail(product);
                          }}
                          className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors cursor-pointer mt-0.5"
                        >
                          {product.name}
                        </h4>
                      </div>

                      {/* PRICE & BUTTONS */}
                      <div className="pt-1.5">
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="text-xs sm:text-sm font-black text-slate-900">₹{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>

                        {/* ADD TO BAG & BUY NOW BUTTONS */}
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => addToCart(product, product.sizes?.[0] || 'M')}
                            className="py-1.5 px-1 rounded-lg border border-slate-200 hover:border-slate-900 text-slate-800 text-[10px] font-black transition-colors text-center truncate cursor-pointer active:scale-95"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              buyNow(product, product.sizes?.[0] || 'M');
                            }}
                            className="py-1.5 px-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black transition-colors text-center truncate cursor-pointer active:scale-95"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* NO PRODUCTS FOUND STATE (REAL 0 MATCHES ONLY) */
            <div className="py-12 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-sm font-black text-slate-800">
                No products found for "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Please check your spelling or search for popular terms like "oversized", "polo", "shirts", or "t-shirt".
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM FOOTER BUTTON */}
        {searchQuery.trim() && matchedProducts.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              Showing top matching fits from QuickFit stores
            </span>
            <button
              onClick={() => executeSearch()}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all shadow cursor-pointer text-center"
            >
              See All Results for "{searchQuery}" ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlayModal;
