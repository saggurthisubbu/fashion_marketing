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

  const isAdminAuthenticated = Boolean(
    user && (user.role === 'admin' || user.role === 'store_owner') && (token || localStorage.getItem('quickfit_token'))
  );

  // Bi-directional /admin & /admin/login URL Synchronization
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const shouldOpenAdmin = (
        path.startsWith('/admin') ||
        hash === '#admin' ||
        hash === '#/admin' ||
        search.includes('admin=true') ||
        search.includes('admin=1')
      );

      if (shouldOpenAdmin) {
        setIsAdminOpen(true);
        // Requirement 3: If admin authentication is required, redirect to /admin/login
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
  }, [setIsAdminOpen, isAdminAuthenticated]);

  // Sync URL when modal is opened or closed or auth state changes
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (isAdminOpen) {
      if (isAdminAuthenticated) {
        // Authenticated admin should be on /admin
        if (path === '/admin/login' || path === '/admin/login/' || !path.startsWith('/admin')) {
          window.history.replaceState({ modal: 'admin' }, '', '/admin');
        }
      } else {
        // Unauthenticated user must be on /admin/login (Requirement 3)
        if (path === '/admin' || path === '/admin/' || !path.startsWith('/admin')) {
          window.history.replaceState({ modal: 'admin_login' }, '', '/admin/login');
        }
      }
    } else {
      if (path.startsWith('/admin')) {
        window.history.pushState({ modal: 'home' }, '', '/');
      }
    }
  }, [isAdminOpen, isAdminAuthenticated]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* PUBLIC STICKY NAVBAR */}
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
