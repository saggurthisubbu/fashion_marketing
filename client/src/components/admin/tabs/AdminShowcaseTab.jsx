import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Sparkles,
  CheckCheck,
  XCircle,
  Save,
  Search,
  Filter,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { resolveImageUrl, handleImageError, DEFAULT_PLACEHOLDER_IMAGE } from '../../../config/api';

export const AdminShowcaseTab = ({
  productsList = [],
  API_BASE_URL = '',
  token = '',
  showToast = () => {},
  onRefresh = () => {}
}) => {
  const [products, setProducts] = useState(productsList);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [initialIds, setInitialIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const authToken = token || localStorage.getItem('quickfit_token') || '';
  const authHeaders = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }), [authToken]);

  // Load showcase status from backend on mount
  useEffect(() => {
    let isMounted = true;

    const loadShowcaseData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/admin/showcase`, authHeaders);
        if (isMounted && res.data) {
          const fetchedProducts = Array.isArray(res.data.products) && res.data.products.length > 0
            ? res.data.products
            : productsList;
          setProducts(fetchedProducts);

          const ids = new Set(res.data.showcaseProductIds || []);
          setSelectedIds(ids);
          setInitialIds(new Set(ids));
        }
      } catch (err) {
        console.warn('Could not fetch showcase endpoint, using productsList fallback:', err.message);
        if (isMounted) {
          setProducts(productsList);
          const activeIds = new Set(
            productsList.filter(p => p.isHeroShowcase).map(p => (p._id || p.id).toString())
          );
          setSelectedIds(activeIds);
          setInitialIds(new Set(activeIds));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadShowcaseData();

    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL, authHeaders, productsList]);

  // Toggle single product selection
  const handleToggleProduct = (productId) => {
    const idStr = productId.toString();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  // Select all visible (or all) products
  const handleSelectAll = () => {
    const allIds = new Set(products.map(p => (p._id || p.id).toString()));
    setSelectedIds(allIds);
  };

  // Deselect all products
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const idArray = Array.from(selectedIds);
      
      const res = await axios.put(
        `${API_BASE_URL}/admin/showcase`,
        { showcaseProductIds: idArray },
        authHeaders
      );

      if (res.data?.success || res.status === 200) {
        setInitialIds(new Set(selectedIds));
        showToast(`Saved! ${idArray.length} product(s) in Home Page Showcase.`, 'success');

        // Notify client and homepage to refresh immediately
        window.dispatchEvent(new CustomEvent('quickfit_showcase_updated', {
          detail: { showcaseProductIds: idArray }
        }));
        window.dispatchEvent(new CustomEvent('quickfit_products_updated'));

        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to save showcase products:', err);
      showToast(err.response?.data?.message || 'Failed to save showcase selections.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.subcategory) set.add(p.subcategory);
      else if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products based on search & category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || sub.includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.subcategory === selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const hasUnsavedChanges = useMemo(() => {
    if (selectedIds.size !== initialIds.size) return true;
    for (const id of selectedIds) {
      if (!initialIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, initialIds]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Home Page Hero Showcase
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
            Home Page Showcase Manager
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Choose which products appear in the animated 3D hero carousel on the homepage.
            Only selected items will rotate in the carousel. Changes persist permanently across redeployments.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            data-showcase-select-all="true"
            onClick={handleSelectAll}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 border border-zinc-700/80 cursor-pointer shadow-xs active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            Select All
          </button>

          <button
            type="button"
            data-showcase-deselect="true"
            onClick={handleDeselectAll}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 border border-zinc-700/80 cursor-pointer shadow-xs active:scale-95"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            Deselect All
          </button>

          <button
            type="button"
            data-showcase-save="true"
            disabled={isSaving}
            onClick={handleSaveChanges}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 animate-pulse'
                : 'bg-white hover:bg-zinc-100 text-zinc-950'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes {hasUnsavedChanges && '●'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Selection Status Badge */}
        <div className="md:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-black text-sm">
                {selectedIds.size} of {products.length} Selected
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {selectedIds.size === 0
                  ? 'Static Hero Image fallback'
                  : selectedIds.size === 1
                  ? 'Single Product card'
                  : `${selectedIds.size}-Product 3D Carousel`}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
            selectedIds.size >= 2
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {selectedIds.size >= 2 ? 'Active Carousel' : 'Static Fallback'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-zinc-400 text-xs font-mono">Loading product showcase catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
          <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm font-bold">No products match your search or filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="text-amber-400 text-xs font-mono underline hover:text-amber-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const id = (prod._id || prod.id).toString();
            const isSelected = selectedIds.has(id);
            const imgSrc = resolveImageUrl(prod.images?.front || prod.image || DEFAULT_PLACEHOLDER_IMAGE);

            return (
              <div
                key={id}
                data-showcase-item="true"
                onClick={() => handleToggleProduct(id)}
                className={`group relative bg-zinc-900 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3.5 flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500/80 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/50 bg-zinc-900/90'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                }`}
              >
                {/* Top Row: Image & Details */}
                <div className="space-y-3">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img
                      src={imgSrc}
                      alt={prod.name}
                      loading="lazy"
                      onError={(e) => handleImageError(e, DEFAULT_PLACEHOLDER_IMAGE)}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Checkbox overlay badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                            : 'bg-zinc-900/80 border border-zinc-700 text-transparent backdrop-blur-xs'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>

                    {/* Category pill */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[9px] font-mono font-bold uppercase text-zinc-300">
                      {prod.subcategory || prod.category || 'Apparel'}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                      {prod.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono font-black text-white">
                        ₹{prod.price}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        prod.inStock
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {prod.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Toggle Pill */}
                <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className={`font-mono font-bold flex items-center gap-1.5 ${
                    isSelected ? 'text-amber-400' : 'text-zinc-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-zinc-600'}`}></span>
                    {isSelected ? 'In Hero Showcase' : 'Excluded from Hero'}
                  </span>

                  <span className="text-[10px] text-zinc-400 underline group-hover:text-white transition-colors">
                    {isSelected ? 'Remove' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Reminder if unsaved changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-zinc-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>You have unsaved showcase changes!</span>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 transition-all cursor-pointer font-bold ml-2 shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminShowcaseTab;
