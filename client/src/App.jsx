import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesGrid } from './components/FeaturesGrid';
import { CategoriesSection } from './components/CategoriesSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { WishlistModal } from './components/WishlistModal';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { ContactModal } from './components/ContactModal';
import { AboutModal } from './components/AboutModal';
import { InstallPWA } from './components/InstallPWA';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const ToastNotification = () => {
  const { toast } = useShop();
  if (!toast) return null;

  const icons = { success: '⚡', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] glass-dark px-5 py-3 rounded-2xl text-white text-xs font-bold shadow-2xl border border-white/20 flex items-center gap-3 max-w-xs animate-in slide-in-from-bottom duration-300 ${
      toast.type === 'error' ? 'bg-rose-900/90' : toast.type === 'warning' ? 'bg-amber-800/90' : ''
    }`}>
      <span className="text-base">{icons[toast.type] || '⚡'}</span>
      <span>{toast.message}</span>
    </div>
  );
};

const MainApp = () => {
  const { isAdminOpen, setIsAdminOpen, user, token } = useShop();
  const [currentPath, setCurrentPath] = React.useState(() => window.location.pathname.toLowerCase());

  const isAuthenticated = Boolean(user && (token || localStorage.getItem('quickfit_token')));
  const isAdminAuthenticated = Boolean(
    isAuthenticated && (user.role === 'admin' || user.role === 'store_owner')
  );

  // Bi-directional URL Synchronization & Route Protection
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isAuth = Boolean(user && (token || localStorage.getItem('quickfit_token')));

      // REQUIREMENT 1 & 2: If user is not authenticated, block all pages and redirect to /login (except /register)
      if (!isAuth) {
        if (path === '/register' || path === '/register/') {
          setCurrentPath('/register');
        } else {
          if (path !== '/login' && path !== '/login/') {
            window.history.replaceState({ modal: 'login' }, '', '/login');
          }
          setCurrentPath('/login');
        }
        setIsAdminOpen(false);
        return;
      }

      // REQUIREMENT 4: If user is already logged in and visits /login or /register, skip and open homepage directly
      if (path === '/login' || path === '/login/' || path === '/register' || path === '/register/') {
        window.history.replaceState({ modal: 'home' }, '', '/');
        setCurrentPath('/');
      } else {
        setCurrentPath(path);
      }

      // Admin route handling for authenticated admins
      const shouldOpenAdmin = (
        path.startsWith('/admin') ||
        hash === '#admin' ||
        hash === '#/admin' ||
        search.includes('admin=true') ||
        search.includes('admin=1')
      );

      if (shouldOpenAdmin) {
        setIsAdminOpen(true);
        if (!isAdminAuthenticated && (path === '/admin' || path === '/admin/')) {
          window.history.replaceState({ modal: 'admin_login' }, '', '/admin/login');
        } else if (isAdminAuthenticated && (path === '/admin/login' || path === '/admin/login/')) {
          window.history.replaceState({ modal: 'admin' }, '', '/admin');
        }
      } else {
        setIsAdminOpen(false);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [user, token, setIsAdminOpen, isAdminAuthenticated]);

  // Handle admin modal URL synchronization
  useEffect(() => {
    if (!isAuthenticated) return;

    const path = window.location.pathname.toLowerCase();
    if (isAdminOpen) {
      if (isAdminAuthenticated) {
        if (path === '/admin/login' || path === '/admin/login/' || !path.startsWith('/admin')) {
          window.history.replaceState({ modal: 'admin' }, '', '/admin');
        }
      } else {
        if (path === '/admin' || path === '/admin/' || !path.startsWith('/admin')) {
          window.history.replaceState({ modal: 'admin_login' }, '', '/admin/login');
        }
      }
    } else {
      if (path.startsWith('/admin')) {
        window.history.pushState({ modal: 'home' }, '', '/');
      }
    }
  }, [isAdminOpen, isAdminAuthenticated, isAuthenticated]);

  const handleCloseAuth = () => {
    window.history.replaceState({ modal: 'home' }, '', '/');
    setCurrentPath('/');
  };

  // ─── PROTECTED ROUTE GATE ───────────────────────────────────────────────────
  // If not authenticated, exclusively render the Login or Register screen
  if (!isAuthenticated) {
    const isRegister = currentPath === '/register' || currentPath === '/register/';
    return (
      <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-400 selection:text-slate-950 font-sans antialiased">
        {isRegister ? (
          <RegisterPage onClose={handleCloseAuth} />
        ) : (
          <LoginPage onClose={handleCloseAuth} />
        )}
        <ToastNotification />
      </div>
    );
  }

  // ─── AUTHENTICATED STORE (HOMEPAGE & ALL FEATURES UNLOCKED) ────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* PUBLIC STICKY NAVBAR WITH USER PROFILE */}
      <Navbar />

      {/* HERO SECTION */}
      <Hero />

      {/* MEN'S CURATED CATEGORY HUBS */}
      <CategoriesSection />

      {/* PRODUCT CATALOG WITH 4-ANGLE GALLERY & FILTERS */}
      <ProductCatalog />

      {/* REVIEWS */}
      <Testimonials />

      {/* WHY CHOOSE QUICKFIT — informational, placed just above footer */}
      <FeaturesGrid />

      {/* FOOTER */}
      <Footer />

      {/* CUSTOMER MODALS & DRAWERS */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <WishlistModal />
      <AuthModal />
      <ContactModal />
      <AboutModal />

      {/* HIDDEN ADMIN DASHBOARD (ACCESSIBLE STRICTLY VIA /admin ROUTE) */}
      <AdminDashboardModal />

      {/* PWA INSTALL BANNER */}
      <InstallPWA />

      {/* TOAST NOTIFICATION */}
      <ToastNotification />
    </div>
  );
};

export function App() {
  return (
    <ShopProvider>
      <MainApp />
    </ShopProvider>
  );
}

export default App;
