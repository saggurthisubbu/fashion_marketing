import React, { useState, useEffect, useRef } from 'react';
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

  const isAdminUser = user?.role === 'admin' || user?.role === 'store_owner';
  const ADMIN_URL = `${window.location.origin}/admin`;

  // Log admin URL whenever an admin is logged in
  useEffect(() => {
    if (isAdminUser) {
      console.log('%c[QuickFit Admin] Dashboard URL → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
    }
  }, [isAdminUser, ADMIN_URL]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showIOSDownloadTip, setShowIOSDownloadTip] = useState(false);
  const deferredInstallPrompt = useRef(null);
  const isAlreadyInstalled = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  // Capture the PWA install prompt so the Download App button can trigger it
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredInstallPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleDownloadApp = async () => {
    if (isAlreadyInstalled) {
      // Already installed — nothing to do, just close mobile menu
      setIsMobileMenuOpen(false);
      return;
    }
    if (deferredInstallPrompt.current) {
      // Chrome / Android: trigger native install dialog
      try {
        await deferredInstallPrompt.current.prompt();
        const { outcome } = await deferredInstallPrompt.current.userChoice;
        if (outcome === 'accepted') deferredInstallPrompt.current = null;
      } catch (_) {}
    } else if (isIOS) {
      // iOS Safari: show the tip overlay
      setShowIOSDownloadTip(true);
      setIsMobileMenuOpen(false);
    } else {
      // Fallback: scroll to top (PWA may already be installed or prompt not yet fired)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

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

          {/* DOWNLOAD APP CTA — Desktop, always visible between categories and actions */}
          <a
            id="navbar-download-app-btn"
            href="#"
            onClick={(e) => { e.preventDefault(); handleDownloadApp(); }}
            aria-label="Download QuickFit App"
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              boxShadow: '0 2px 12px 0 rgba(139,92,246,0.45)'
            }}
          >
            {/* Download arrow icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 flex-shrink-0"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            <span>Download App</span>
            {/* Subtle phone icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3 opacity-75 flex-shrink-0"
            >
              <path d="M8 16.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
              <path fillRule="evenodd" d="M4 4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4Zm4-1.5v.75c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75V2.5h-4ZM8.5 2.5V2h3v.5h-3ZM6.5 4A1.5 1.5 0 0 0 5 5.5v9A1.5 1.5 0 0 0 6.5 16h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 4h-7Z" clipRule="evenodd" />
            </svg>
          </a>

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

            {/* ADMIN PANEL BUTTON — Desktop only, visible when admin/store_owner logged in */}
            {isAdminUser && (
              <button
                id="navbar-admin-panel-btn"
                onClick={() => {
                  console.log('%c[QuickFit Admin] Opening Admin Dashboard → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
                  setIsAdminOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 border border-amber-500 text-xs font-black text-slate-900 transition-all cursor-pointer shadow-sm animate-pulse hover:animate-none"
                title={`Open Admin Dashboard (${ADMIN_URL})`}
              >
                <span>⚡</span>
                <span>{user?.role === 'store_owner' ? 'Store Panel' : 'Admin Panel'}</span>
              </button>
            )}

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
          
          {/* DOWNLOAD APP CTA — Mobile, always at top */}
          <div>
            <button
              id="mobile-download-app-btn"
              onClick={handleDownloadApp}
              className="w-full py-3 px-4 rounded-xl text-white text-xs font-black flex items-center justify-between shadow-md transition-all active:scale-98 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 3px 14px 0 rgba(139,92,246,0.4)'
              }}
            >
              <div className="flex items-center gap-2.5">
                {/* Phone icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M4 4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4Zm4-1.5v.75c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75V2.5h-4ZM8.5 2.5V2h3v.5h-3ZM6.5 4A1.5 1.5 0 0 0 5 5.5v9A1.5 1.5 0 0 0 6.5 16h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 4h-7Z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <div className="font-black text-xs tracking-wide">{isAlreadyInstalled ? '✓ App Installed' : 'Download App'}</div>
                  <div className="text-white/70 font-medium" style={{fontSize:'9px'}}>Get the QuickFit mobile experience</div>
                </div>
              </div>
              {/* Download arrow */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 opacity-90">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
            </button>
          </div>

          {/* ADMIN PANEL CTA — only for admin/store_owner on mobile */}
          {isAdminUser && (
            <div>
              <button
                id="mobile-admin-panel-btn"
                onClick={() => {
                  console.log('%c[QuickFit Admin] Opening Admin Dashboard → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
                  setIsAdminOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 border border-amber-500 text-slate-900 text-xs font-black hover:bg-amber-300 transition-colors flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{user?.role === 'store_owner' ? 'Open Store Dashboard' : 'Open Admin Panel'}</span>
                </div>
                <span className="text-slate-700 text-xs font-black">➔</span>
              </button>
            </div>
          )}

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

      {/* iOS "Add to Home Screen" tip overlay */}
      {showIOSDownloadTip && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4"
          style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}
          onClick={() => setShowIOSDownloadTip(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl mb-8 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">⚡</div>
                <div>
                  <div className="font-black text-slate-900 text-sm">Install QuickFit</div>
                  <div className="text-slate-500 text-[10px] font-medium">Add to your Home Screen</div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSDownloadTip(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-xl flex-shrink-0">1️⃣</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tap the Share button</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Look for the <span className="font-black">⎙</span> icon in the Safari toolbar at the bottom</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-xl flex-shrink-0">2️⃣</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tap "Add to Home Screen"</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">Scroll down in the share sheet and tap this option</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-xl flex-shrink-0">3️⃣</span>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tap "Add" to confirm</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">QuickFit will appear on your home screen like a native app</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSDownloadTip(false)}
              className="mt-4 w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-black transition-colors"
            >Got it ✓</button>
          </div>
          {/* Arrow pointing down toward Safari toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-2xl animate-bounce pointer-events-none">⬇</div>
        </div>
      )}

    </header>
  );
};
