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

const ToastNotification = () => {
  const { toast } = useShop();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 glass-dark px-5 py-3 rounded-2xl text-white text-xs font-bold shadow-2xl border border-white/20 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
      <span className="text-base">{toast.type === 'info' ? 'ℹ️' : '⚡'}</span>
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
