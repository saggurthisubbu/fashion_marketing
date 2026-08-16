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
  const { isAdminOpen, setIsAdminOpen } = useShop();

  // Bi-directional /admin URL Synchronization
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
  }, [setIsAdminOpen]);

  // Sync URL when modal is opened or closed programmatically
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (isAdminOpen) {
      if (!path.startsWith('/admin')) {
        window.history.pushState({ modal: 'admin' }, '', '/admin');
      }
    } else {
      if (path.startsWith('/admin')) {
        window.history.pushState({ modal: 'home' }, '', '/');
      }
    }
  }, [isAdminOpen]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* PUBLIC STICKY NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <Hero />

      {/* 3-PILLAR QUALITY STANDARD */}
      <FeaturesGrid />

      {/* MEN'S CURATED CATEGORY HUBS */}
      <CategoriesSection />

      {/* PRODUCT CATALOG WITH 4-ANGLE GALLERY & FILTERS */}
      <ProductCatalog />

      {/* REVIEWS */}
      <Testimonials />

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
