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
    user
  } = useShop();

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
      
      {/* TOP ANNOUNCEMENT BAR — Responsive & Clean */}
      <div className="bg-slate-900 text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase py-1.5 sm:py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Main message */}
          <div className="flex items-center gap-1.5 sm:gap-2 truncate mx-auto sm:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
            <span className="truncate hidden sm:inline">
              QUICKFIT LUXURY MENSWEAR • HEAVYWEIGHT COTTON STREETWEAR
            </span>
            <span className="truncate sm:hidden text-[10px] tracking-wide">
              QUICKFIT • 60-MIN EXPRESS LUXURY MENSWEAR
            </span>
          </div>

          {/* Desktop-only quick links (moved to hamburger menu on mobile) */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-[10px] font-bold">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </div>

        </div>
      </div>

      {/* MAIN NAV CONTAINER */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-1.5 sm:gap-4">
          
          {/* BRAND LOGO */}
          <div
            onClick={() => {
              setSelectedCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 select-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm sm:text-base md:text-lg shadow-sm">
              ⚡
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl md:text-2xl font-black font-heading tracking-tight text-slate-900">
                QuickFit
              </span>
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase px-1 py-0.2 rounded-xs bg-slate-900 text-white tracking-wider hidden xs:inline">
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
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
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

          {/* ACTION BUTTONS — Scaled for 320px–414px Mobile + Desktop */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* MOBILE SEARCH TOGGLE */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center text-sm transition-colors cursor-pointer"
              aria-label="Search"
            >
              🔍
            </button>

            {/* AUTH / USER (Desktop only — on mobile accessible via hamburger) */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span>👤</span>
              <span className="truncate max-w-[90px]">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </button>

            {/* WISHLIST */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <span className="text-base">♡</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* BAG / CART */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              aria-label="Cart"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Bag</span>
              <span className="min-w-4 h-4 px-1 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            </button>

            {/* MOBILE MENU TOGGLE (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>

        </div>

        {/* MOBILE EXPANDABLE SEARCH BAR */}
        {isSearchOpen && (
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-2.5 pt-0.5">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search oversized, drop shoulder, polo shirts..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                autoFocus
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
            </div>
          </form>
        )}
      </div>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 shadow-xl">
          
          {/* Customer Account / Sign In CTA */}
          <div>
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="truncate">{user ? `Signed in as ${user.name}` : 'Sign In / Register Customer Account'}</span>
              </div>
              <span className="text-slate-400 text-xs font-black">➔</span>
            </button>
          </div>

          {/* Men's Collections */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Men's Collections
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links: About Us & Contact Us (Moved into hamburger on mobile) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Store Information
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setIsAboutModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ℹ️</span>
                <span>About Us</span>
              </button>
              <button
                onClick={() => {
                  setIsContactModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>💬</span>
                <span>Contact Us</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </header>
  );
};
