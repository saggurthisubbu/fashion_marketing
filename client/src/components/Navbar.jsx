import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const Navbar = () => {
  const {
    cart,
    wishlist,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsTrackingOpen,
    setIsAdminOpen,
    setIsAuthModalOpen,
    setIsContactModalOpen,
    user,
    products
  } = useShop();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search Auto-suggestions
  const filteredSuggestions = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.boutique.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleCategoryNav = (cat) => {
    setSelectedCategory(cat);
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/60 transition-all duration-300">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-between shadow-inner max-w-7xl mx-auto">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="font-semibold text-orange-300">EXPRESS VIJAYAWADA:</span> Guaranteed 60-Min Doorstep Fashion Delivery!
        </span>

        <div className="flex items-center gap-4 text-[11px]">
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="hover:text-orange-300 transition-colors font-semibold hidden sm:inline"
          >
            📞 Contact Us
          </button>

          {/* ADMIN CONTROL PANEL LINK */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="bg-orange-500 hover:bg-orange-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm transition-all"
          >
            🔑 Admin Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleCategoryNav('All')}>
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-white">
                1H
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-heading">
                  Quick<span className="text-blue-600">Fit</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 rounded-full border border-blue-200 uppercase tracking-wider">
                  Express
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Fashion In 60 Mins • Vijayawada
              </p>
            </div>
          </div>

          {/* SEARCH BAR WITH AUTO-SUGGEST */}
          <div className="flex-1 max-w-md mx-2 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search shirts, sarees, kurtis, boutiques in Vijayawada..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full bg-white/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 shadow-inner transition-all"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* AUTO-SUGGESTIONS DROPDOWN */}
            {isSearchFocused && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Instant Vijayawada Results
                </div>
                {filteredSuggestions.map((item) => (
                  <div
                    key={item.id || item._id}
                    onClick={() => {
                      setSearchQuery(item.name);
                      handleCategoryNav(item.category);
                    }}
                    className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.boutique}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-600">₹{item.price}</div>
                      <div className="text-[9px] font-semibold text-orange-500">{item.expressDelivery}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold text-slate-700">
            {['All', 'Men', 'Women', 'Kids', 'Sarees', 'Kurtis'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryNav(category)}
                className="hover:text-blue-600 transition-colors py-1 relative group"
              >
                {category}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}
          </nav>

          {/* ACTION BUTTONS (WISHLIST, AUTH & CART) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* USER AUTH BUTTON */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Customer Account"
            >
              <span>👤</span>
              <span className="hidden md:inline">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </button>

            {/* WISHLIST BUTTON */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-rose-600 transition-colors"
              title="Wishlist"
            >
              <svg className="w-5 h-5" fill={wishlist.length > 0 ? '#e11d48' : 'none'} viewBox="0 0 24 24" stroke={wishlist.length > 0 ? '#e11d48' : 'currentColor'}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-md animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* SHOPPING CART BUTTON */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline">Bag</span>
              {totalCartCount > 0 && (
                <span className="bg-orange-500 text-white text-[11px] font-black rounded-full h-5 px-1.5 flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>

        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between px-2 py-1 bg-slate-100 rounded-xl text-xs text-slate-700">
            <span>📍 Delivery Area: <strong>Vijayawada (5 KM)</strong></span>
            <button 
              onClick={() => { setIsTrackingOpen(true); setIsMobileMenuOpen(false); }}
              className="text-blue-600 font-bold underline"
            >
              Track Live Map
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {['All', 'Men', 'Women', 'Kids', 'Shirts', 'Sarees', 'Kurtis', 'Party Wear'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryNav(category)}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => { setIsAdminOpen(true); setIsMobileMenuOpen(false); }}
              className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg"
            >
              🔑 Admin Dashboard
            </button>
            <button
              onClick={() => { setIsContactModalOpen(true); setIsMobileMenuOpen(false); }}
              className="text-xs font-bold text-slate-700"
            >
              📞 Contact Details
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
