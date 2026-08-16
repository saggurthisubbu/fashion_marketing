import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

export const Navbar = () => {
  const {
    cart,
    wishlist,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsAuthModalOpen,
    setIsContactModalOpen,
    setIsAboutModalOpen,
    setIsAdminOpen,
    user
  } = useShop();

  const isAdmin = Boolean(user && user.role === 'admin');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navCategories = [
    { label: 'All Fits', slug: 'All' },
    { label: 'Oversized', slug: 'Oversized T-Shirts' },
    { label: 'Drop Shoulder', slug: 'Drop Shoulder T-Shirts' },
    { label: 'Polo', slug: 'Polo T-Shirts' },
    { label: 'Shirts', slug: 'Shirts' }
  ];

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setIsMobileMenuOpen(false);
    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const catalogElement = document.getElementById('catalog-section');
      if (catalogElement) {
        catalogElement.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-2xs">
      
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-white text-[11px] font-bold tracking-wider uppercase py-2 px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span className="truncate">QUICKFIT LUXURY MENSWEAR • HEAVYWEIGHT COTTON STREETWEAR</span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 text-[10px] font-bold">
          {isAdmin && (
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase hover:bg-amber-300 transition-all cursor-pointer shadow-sm animate-pulse"
              title="Open Admin Dashboard"
            >
              <span>⚡</span>
              <span>Admin Portal</span>
            </button>
          )}
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="hidden sm:inline text-slate-300 hover:text-white transition-colors"
          >
            About Us
          </button>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>

      {/* MAIN NAV CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* BRAND LOGO */}
          <div
            onClick={() => {
              setSelectedCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
              ⚡
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
                QuickFit
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-xs bg-slate-900 text-white ml-1.5 tracking-wider hidden xs:inline">
                MEN
              </span>
            </div>
          </div>

          {/* DESKTOP SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search oversized, drop shoulder, polo shirts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
            </div>
          </form>

          {/* DESKTOP MEN'S CATEGORIES */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold text-slate-600">
            {navCategories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* ADMIN DASHBOARD BUTTON (ADMINS ONLY) */}
            {isAdmin && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 text-amber-300 hover:bg-black font-black text-xs transition-all shadow-md !min-h-[40px] cursor-pointer border border-amber-400/40 hover:scale-105"
                title="Open Admin Dashboard (/admin)"
              >
                <span className="text-sm">⚡</span>
                <span className="tracking-wide">Go to Admin Dashboard</span>
              </button>
            )}

            {/* MOBILE SEARCH TOGGLE */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-700 !min-h-[44px] !min-w-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              🔍
            </button>

            {/* AUTH / USER */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors !min-h-[40px]"
            >
              <span>👤</span>
              <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </button>

            {/* WISHLIST */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 sm:px-3 sm:py-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors !min-h-[44px] !min-w-[44px] flex items-center justify-center"
              aria-label="Wishlist"
            >
              <span className="text-base">♡</span>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* BAG / CART */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md transition-all !min-h-[44px]"
            >
              <span>🛍️</span>
              <span>Bag</span>
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            </button>

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-slate-700 !min-h-[44px] !min-w-[44px] flex items-center justify-center font-bold text-lg"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>

        </div>

        {/* MOBILE EXPANDABLE SEARCH BAR */}
        {isSearchOpen && (
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-3 pt-1">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search oversized, drop shoulder, polo shirts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                autoFocus
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
            </div>
          </form>
        )}
      </div>

      {/* MOBILE EXPANDED MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          
          {/* MOBILE ADMIN DASHBOARD SHORTCUT (ADMINS ONLY) */}
          {isAdmin && (
            <div className="pb-2">
              <button
                onClick={() => {
                  setIsAdminOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-amber-300 font-black text-xs flex items-center justify-between shadow-lg border border-amber-400/50 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <span className="tracking-wide uppercase">Go to Admin Dashboard</span>
                </div>
                <span className="text-amber-400 font-black text-sm">➔</span>
              </button>
            </div>
          )}

          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Men's Collections
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => {
                setIsAboutModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 text-center"
            >
              About Us
            </button>
            <button
              onClick={() => {
                setIsContactModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 text-center"
            >
              Contact Us
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-center text-xs font-bold text-blue-600 hover:underline"
            >
              {user ? `Account: ${user.name}` : 'Sign In / Register Customer Account'}
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
