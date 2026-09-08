import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { AppDownloadModal } from './AppDownloadModal';
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

  // Log admin URL whenever an admin is logged in
  useEffect(() => {
    if (isAdminUser) {
      console.log('%c[QuickFit Admin] Dashboard URL → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
    }
  }, [isAdminUser, ADMIN_URL]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleDownloadApp = () => {
    setIsDownloadModalOpen(true);
    setIsMobileMenuOpen(false);
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
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState({ modal: 'search', q: searchQuery.trim() }, '', searchUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      setIsSearchModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
      
      {/* MAIN NAVBAR CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* BRAND LOGO */}
          <div
            onClick={() => {
              if (window.location.pathname.startsWith('/search')) {
                window.history.pushState({ modal: 'home' }, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
              setSelectedCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer flex items-center gap-2 sm:gap-2.5 flex-shrink-0 select-none group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-sm group-hover:bg-black transition-colors">
              ⚡
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl md:text-2xl font-black font-heading tracking-tight text-slate-900 uppercase">
                QuickFit
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-900 text-white tracking-widest hidden xs:inline">
                MEN
              </span>
            </div>
          </div>

          {/* DESKTOP SEARCH BAR (CLICK OPENS MODERN SEARCH OVERLAY) */}
          <div
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2 cursor-pointer"
          >
            <div className="relative w-full">
              <input
                type="text"
                readOnly
                value={searchQuery}
                placeholder="Search oversized, drop shoulder, polo shirts..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer shadow-inner"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
            </div>
          </div>

          {/* DESKTOP CATEGORY NAVIGATION */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold text-slate-600">
            {navCategories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* DOWNLOAD APP BUTTON (Desktop) */}
            <button
              id="navbar-download-app-btn"
              onClick={handleDownloadApp}
              aria-label="Download QuickFit App"
              className="hidden lg:flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-black text-white cursor-pointer flex-shrink-0 transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 2px 10px 0 rgba(139,92,246,0.35)'
              }}
            >
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
            </button>

            {/* MOBILE SEARCH TOGGLE */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center text-sm transition-colors cursor-pointer flex-shrink-0"
              aria-label="Search"
            >
              🔍
            </button>

            {/* ADMIN PANEL BUTTON (Desktop) */}
            {isAdminUser && (
              <button
                id="navbar-admin-panel-btn"
                onClick={() => {
                  console.log('%c[QuickFit Admin] Opening Admin Dashboard → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
                  setIsAdminOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-amber-400 hover:bg-amber-300 border border-amber-500 text-xs font-black text-slate-900 transition-all cursor-pointer shadow-xs flex-shrink-0"
                title={`Open Admin Dashboard (${ADMIN_URL})`}
              >
                <span>⚡</span>
                <span>{user?.role === 'store_owner' ? 'Store Panel' : 'Admin Panel'}</span>
              </button>
            )}

            {/* ACCOUNT / SIGN IN — Profile Dropdown or Auth Buttons */}
            {user ? (
              /* ── LOGGED-IN: Profile Dropdown ─────────────────────────── */
              <div className="hidden sm:block relative" ref={profileRef}>
                <button
                  id="navbar-profile-btn"
                  onClick={() => setIsProfileOpen(p => !p)}
                  className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer flex-shrink-0 group"
                >
                  {/* AVATAR */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[72px]">{user.name.split(' ')[0]}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>

                {/* DROPDOWN MENU */}
                {isProfileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
                    style={{ animation: 'dropdownIn 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
                  >
                    {/* USER INFO HEADER */}
                    <div className="px-4 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-base font-black">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                        </div>
                      </div>
                      {(user.role === 'admin' || user.role === 'store_owner') && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-wider">
                          ⚡ {user.role === 'store_owner' ? 'Store Owner' : 'Administrator'}
                        </div>
                      )}
                    </div>

                    {/* MENU ITEMS */}
                    <div className="py-1.5">
                      {[
                        { icon: '📦', label: 'My Orders', action: () => { setIsProfileOpen(false); } },
                        { icon: '❤️', label: 'My Wishlist', action: () => { setIsWishlistOpen(true); setIsProfileOpen(false); } },
                        { icon: '⚙️', label: 'Account Settings', action: () => { setIsAuthModalOpen(true); setIsProfileOpen(false); } },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group/item"
                        >
                          <span className="text-base w-5 text-center">{item.icon}</span>
                          <span className="text-xs font-bold text-slate-700 group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto w-3 h-3 text-slate-300 group-hover/item:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      ))}

                      {(user.role === 'admin' || user.role === 'store_owner') && (
                        <button
                          onClick={() => { setIsAdminOpen(true); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors group/item"
                        >
                          <span className="text-base w-5 text-center">⚡</span>
                          <span className="text-xs font-bold text-amber-700 group-hover/item:text-amber-900">{user.role === 'store_owner' ? 'Store Dashboard' : 'Admin Dashboard'}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={() => { logoutUser(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-rose-50 transition-colors group/item"
                      >
                        <span className="text-base w-5 text-center">🚪</span>
                        <span className="text-xs font-bold text-rose-600 group-hover/item:text-rose-700">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
                <style>{`@keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
              </div>
            ) : (
              /* ── LOGGED-OUT: Sign In + Register Buttons ─────────────── */
              <div className="hidden sm:flex items-center gap-2">
                <button
                  id="navbar-signin-btn"
                  onClick={() => navigateTo('/login')}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 text-slate-600">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <span>Sign In</span>
                </button>
                <button
                  id="navbar-register-btn"
                  onClick={() => navigateTo('/register')}
                  className="hidden lg:flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-black text-white transition-all cursor-pointer flex-shrink-0 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                >
                  Join QuickFit
                </button>
              </div>
            )}

            {/* WISHLIST */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative group w-9 h-9 rounded-full border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-500 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 transition-all duration-200 group-hover:scale-110 group-hover:stroke-rose-500"
                style={{ fill: wishlist.length > 0 ? 'rgba(244,63,94,0.15)' : 'none', stroke: wishlist.length > 0 ? '#f43f5e' : 'currentColor' }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm pointer-events-none">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* CART / BAG */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black shadow-xs transition-all cursor-pointer flex-shrink-0"
              aria-label="Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 flex-shrink-0"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="hidden sm:inline">Bag</span>
              <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            </button>

            {/* MOBILE MENU TOGGLE (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base transition-colors cursor-pointer flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 shadow-xl">
          
          {/* DOWNLOAD APP CTA */}
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M4 4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4Zm4-1.5v.75c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75V2.5h-4ZM8.5 2.5V2h3v.5h-3ZM6.5 4A1.5 1.5 0 0 0 5 5.5v9A1.5 1.5 0 0 0 6.5 16h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 4h-7Z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <div className="font-black text-xs tracking-wide">Download App</div>
                  <div className="text-white/70 font-medium text-[9px]">Get the QuickFit mobile experience</div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 opacity-90">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
            </button>
          </div>

          {/* ADMIN PANEL CTA (Mobile) */}
          {isAdminUser && (
            <div>
              <button
                id="mobile-admin-panel-btn"
                onClick={() => {
                  console.log('%c[QuickFit Admin] Opening Admin Dashboard → ' + ADMIN_URL, 'background:#1e293b;color:#fbbf24;font-weight:bold;padding:4px 8px;border-radius:4px;');
                  setIsAdminOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 border border-amber-500 text-slate-900 text-xs font-black hover:bg-amber-300 transition-colors flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{user?.role === 'store_owner' ? 'Open Store Dashboard' : 'Open Admin Panel'}</span>
                </div>
                <span className="text-slate-700 text-xs font-black">➔</span>
              </button>
            </div>
          )}

          {/* Customer Account / Sign In CTA (Mobile) */}
          {user ? (
            <div className="space-y-2">
              {/* USER INFO */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white">
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">{user.name}</p>
                  <p className="text-[10px] text-white/60 truncate">{user.email}</p>
                </div>
              </div>
              {/* QUICK LINKS */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setIsWishlistOpen(true); setIsMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2">
                  ❤️ Wishlist
                </button>
                <button onClick={() => { logoutUser(); setIsMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
                  🚪 Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigateTo('/login'); setIsMobileMenuOpen(false); }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-black text-center hover:bg-slate-200 transition-colors"
              >
                👤 Sign In
              </button>
              <button
                onClick={() => { navigateTo('/register'); setIsMobileMenuOpen(false); }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-black text-center hover:bg-black transition-colors"
              >
                ✦ Join Now
              </button>
            </div>
          )}

          {/* Category Navigation */}
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

        </div>
      )}

      {/* APP DOWNLOAD MODAL */}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* MODERN AMAZON / FLIPKART STYLE SEARCH OVERLAY MODAL */}
      <SearchOverlayModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchQuery}
      />

    </header>
  );
};

export default Navbar;
