import React from 'react';
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
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { WishlistModal } from './components/WishlistModal';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { ContactModal } from './components/ContactModal';

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
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* STICKY NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <Hero />

      {/* FEATURES GRID */}
      <FeaturesGrid />

      {/* CATEGORIES SECTION */}
      <CategoriesSection />

      {/* PRODUCT CATALOG & FILTERS */}
      <ProductCatalog />

      {/* REVIEWS & TESTIMONIALS */}
      <Testimonials />

      {/* FOOTER */}
      <Footer />

      {/* MODALS & DRAWERS */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <LiveTrackingModal />
      <WishlistModal />

      {/* NEW MODALS */}
      <AdminDashboardModal />
      <AuthModal />
      <ContactModal />

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
