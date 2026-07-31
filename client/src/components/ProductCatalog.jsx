import React from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';

export const ProductCatalog = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useShop();

  // Filter products based on search, category, and subcategory
  let filtered = products.filter((item) => {
    // Search query filter
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.boutique.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === 'All' || 
      item.category === selectedCategory ||
      (selectedCategory === 'Shirts' && item.subcategory === 'Shirts') ||
      (selectedCategory === 'Sarees' && item.subcategory === 'Sarees') ||
      (selectedCategory === 'Kurtis' && item.subcategory === 'Kurtis') ||
      (selectedCategory === 'Jeans' && item.subcategory === 'Jeans') ||
      (selectedCategory === 'Party Wear' && item.subcategory === 'Party Wear');

    // Subcategory filter
    const matchesSubcategory = selectedSubcategory === 'All' || item.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Sort logic
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount; // Default popular
  });

  const categoriesList = ['All', 'Men', 'Women', 'Kids', 'Shirts', 'Sarees', 'Kurtis', 'Party Wear'];
  const subcategoriesList = ['All', 'Shirts', 'Sarees', 'Kurtis', 'T-Shirts', 'Formals', 'Dresses', 'Boys Wear', 'Girls Wear'];

  return (
    <section id="catalog" className="py-16 bg-slate-100/70 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CATALOG HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold tracking-wider uppercase">
              EXPRESS CATALOG • VIJAYAWADA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading mt-1">
              {selectedCategory === 'All' ? 'All Express Fashion Outfits' : `${selectedCategory} Collection`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing <strong className="text-slate-800 font-bold">{filtered.length}</strong> items ready for 60-minute express delivery.
            </p>
          </div>

          {/* SORT CONTROLS */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="popular">🔥 Most Popular</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* MAIN CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedSubcategory('All');
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-300 shadow-sm ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* SUBCATEGORY PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Filter:</span>
          {subcategoriesList.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubcategory === sub
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* NO RESULTS EMPTY STATE */
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm border border-slate-200 space-y-4 my-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full text-blue-600 flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">No Products Found</h3>
            <p className="text-sm text-slate-500">
              We couldn't find any items matching "{searchQuery || selectedCategory}". Try resetting your filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
