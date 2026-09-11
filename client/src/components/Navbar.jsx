import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { SearchOverlayModal } from './search/SearchOverlayModal';

// ─── Navigate to /login or /register (no react-router) ──────────────────────
const navigateTo = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

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
    setIsAdminOpen,
    setIsAboutModalOpen,
    setIsContactModalOpen,
    user,
    logoutUser,
  } = useShop();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdminUser = user?.role === 'admin' || user?.role === 'store_owner';
  const ADMIN_URL = `${window.location.origin}/admin`;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Strictly the 4 categories specified by the user
  const primaryCategories = [
    { label: 'Oversized T-Shirts', slug: 'Oversized T-Shirts' },
    { label: 'Drop Shoulder T-Shirts', slug: 'Drop Shoulder T-Shirts' },
    { label: 'Polo T-Shirts', slug: 'Polo T-Shirts' },
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

  const handleNavigateHome = () => {
    if (window.location.pathname.startsWith('/search')) {
      window.history.pushState({ modal: 'home' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setSelectedCategory('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleNavigateMensWear = () => {
    if (window.location.pathname.startsWith('/search')) {
      window.history.pushState({ modal: 'home' }, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setSelectedCategory('All');
    setIsMobileMenuOpen(false);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({ modal: 'search', q: searchQuery.trim() }, '', searchUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      setIsSearchModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all shadow-xs">
      
      {/* MAIN NAVBAR CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* BRAND LOGO */}
          <div
            onClick={handleNavigateHome}
            className="cursor-pointer flex items-center gap-2 flex-shrink-0 select-none group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs group-hover:bg-neutral-800 transition-colors">
              ⚡
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl md:text-2xl font-black font-heading tracking-tight text-neutral-950 uppercase">
                QuickFit
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black text-white tracking-widest hidden xs:inline">
                MEN
              </span>
            </div>
          </div>

          {/* DESKTOP PRIMARY NAVIGATION (Home, Mens Wear, About Us, Contact Us) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-bold text-neutral-700">
            <button
              onClick={handleNavigateHome}
              className="px-3 py-1.5 rounded-full hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={handleNavigateMensWear}
              className="px-3 py-1.5 rounded-full hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
            >
              Mens Wear
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="px-3 py-1.5 rounded-full hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-3 py-1.5 rounded-full hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </nav>

          {/* DESKTOP SEARCH BAR */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-1 max-w-xs mx-2"
          >
            <div className="relative w-full flex items-center">
              <span className="absolute left-3 text-neutral-400 text-xs pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchModalOpen(true)}
                placeholder="Search fits, shirts, polo..."
                className="w-full pl-8 pr-8 py-1.5 rounded-full bg-neutral-100 focus:bg-white border border-neutral-200 text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 w-5 h-5 rounded-full bg-black hover:bg-neutral-800 text-white text-[9px] font-black flex items-center justify-center transition-colors cursor-pointer"
                title="Search"
              >
                ➔
              </button>
            </div>
          </form>

          {/* RIGHT ACTION ICONS */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

            {/* MOBILE SEARCH ICON */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="lg:hidden w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-700 flex items-center justify-center text-sm transition-colors cursor-pointer flex-shrink-0"
              aria-label="Search"
            >
              🔍
            </button>

            {/* ADMIN PANEL SHORTCUT (DESKTOP) */}
            {isAdminUser && (
              <button
                id="navbar-admin-panel-btn"
                onClick={() => setIsAdminOpen(true)}
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full bg-black hover:bg-neutral-800 text-[11px] font-black text-white transition-all cursor-pointer shadow-xs flex-shrink-0"
              >
                <span>⚡</span>
                <span>{user?.role === 'store_owner' ? 'Store Panel' : 'Admin Panel'}</span>
              </button>
            )}

            {/* ACCOUNT / SIGN IN (DESKTOP) */}
            {user ? (
              <div className="hidden sm:block relative" ref={profileRef}>
                <button
                  id="navbar-profile-btn"
                  onClick={() => setIsProfileOpen(p => !p)}
                  className="flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-full border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer flex-shrink-0"
                >
                  <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-neutral-800 truncate max-w-[70px]">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-neutral-400">▼</span>
                </button>

                {/* PROFILE DROPDOWN */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-black text-white">
                      <p className="text-xs font-black truncate">{user.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1 text-xs font-bold">
                      <button
                        onClick={() => { setIsWishlistOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <span>♥</span>
                        <span>My Wishlist</span>
                      </button>

                      {isAdminUser && (
                        <button
                          onClick={() => { setIsAdminOpen(true); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-neutral-50 transition-colors text-black"
                        >
                          <span>⚡</span>
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-neutral-100" />

                      <button
                        onClick={() => { logoutUser(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-neutral-50 text-rose-600 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center">
                <button
                  id="navbar-signin-btn"
                  onClick={() => navigateTo('/login')}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-neutral-200 text-xs font-bold text-neutral-800 hover:bg-neutral-100 hover:border-black transition-all cursor-pointer flex-shrink-0"
                >
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* WISHLIST ICON */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-700 hover:text-black flex items-center justify-center text-sm transition-all cursor-pointer flex-shrink-0"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <span>♥</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* BAG / CART BUTTON */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex-shrink-0"
              aria-label="Cart"
            >
              <span>Bag</span>
              <span className="min-w-[1rem] h-4 px-1 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            </button>

            {/* MOBILE MENU TOGGLE (HAMBURGER) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-base transition-colors cursor-pointer flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>

        {/* MOBILE FULL-WIDTH SEARCH BAR */}
        <div className="lg:hidden pb-2.5 pt-0.5">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full"
          >
            <span className="absolute left-3 text-neutral-400 text-xs pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchModalOpen(true)}
              placeholder="Search fits, shirts, polo..."
              className="w-full pl-8 pr-8 py-1.5 rounded-full bg-neutral-100 focus:bg-white border border-neutral-200 text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 w-5 h-5 rounded-full bg-black hover:bg-neutral-800 text-white text-[9px] font-black flex items-center justify-center transition-colors cursor-pointer"
              title="Search"
            >
              ➔
            </button>
          </form>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU DRAWER (CLEAN MONOCHROME B&W) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 shadow-xl">
          
          {/* PRIMARY NAVIGATION LINKS */}
          <div className="space-y-1 pb-3 border-b border-neutral-100">
            <button
              onClick={handleNavigateHome}
              className="w-full text-left py-2 px-3 rounded-xl font-black text-sm text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Home
            </button>
            <button
              onClick={handleNavigateMensWear}
              className="w-full text-left py-2 px-3 rounded-xl font-black text-sm text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Mens Wear
            </button>
            <button
              onClick={() => { setIsAboutModalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl font-black text-sm text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              About Us
            </button>
            <button
              onClick={() => { setIsContactModalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl font-black text-sm text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Contact Us
            </button>
          </div>

          {/* 4 REQUIRED CATEGORIES */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2 px-1">
              Categories
            </div>
            <div className="grid grid-cols-2 gap-2">
              {primaryCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-black text-white font-black'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ADMIN SHORTCUT (IF ADMIN) */}
          {isAdminUser && (
            <button
              id="mobile-admin-panel-btn"
              onClick={() => {
                setIsAdminOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-black text-white text-xs font-black flex items-center justify-between shadow-xs"
            >
              <span>⚡ {user?.role === 'store_owner' ? 'Store Dashboard' : 'Admin Dashboard'}</span>
              <span>➔</span>
            </button>
          )}

          {/* USER PROFILE OR SIGN IN */}
          <div className="pt-2 border-t border-neutral-100">
            {user ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-neutral-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logoutUser(); setIsMobileMenuOpen(false); }}
                  className="text-xs font-black text-rose-600 hover:underline shrink-0 px-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigateTo('/login'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-900 text-xs font-black text-center hover:bg-neutral-200 transition-colors"
              >
                Sign In / Register
              </button>
            )}
          </div>

        </div>
      )}

      {/* SEARCH MODAL */}
      <SearchOverlayModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchQuery}
      />

    </header>
  );
};

export default Navbar;
