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
import { SearchResultsPage } from './pages/SearchResultsPage';
import { CategoryPage } from './pages/CategoryPage';
import { setupForegroundFcmListener, stopUrgentOrderAlert } from './config/firebase';
import { startLoopingOrderAlert, stopOrderAlert, isOrderHandled } from './utils/audioAlert';
import { UrgentOrderAlertModal } from './components/admin/UrgentOrderAlertModal';

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
  const {
    isAdminOpen, setIsAdminOpen, user, token,
    checkoutRedirectPending, setCheckoutRedirectPending, setIsCheckoutOpen,
    API_BASE_URL
  } = useShop();
  const [currentPath, setCurrentPath] = React.useState(() => window.location.pathname.toLowerCase());
  const [urgentOrderQueue, setUrgentOrderQueue] = React.useState([]);

  const currentUrgentAlert = urgentOrderQueue[0] || null;

  const isAuthenticated = Boolean(user && (token || localStorage.getItem('quickfit_token')));
  const isAdminAuthenticated = Boolean(
    isAuthenticated && (user.role === 'admin' || user.role === 'store_owner')
  );

  // Enqueue new order alert and start loud looping buzzer
  const enqueueNewOrderAlert = React.useCallback((alertData) => {
    if (!alertData?.orderId) return;
    const orderId = String(alertData.orderId).trim();

    if (isOrderHandled(orderId)) {
      return;
    }

    setUrgentOrderQueue((prevQueue) => {
      if (prevQueue.some((item) => String(item.orderId).trim() === orderId)) {
        return prevQueue;
      }
      return [...prevQueue, alertData];
    });

    // Start loud looping buzzer immediately (continues until View or Accept is clicked)
    startLoopingOrderAlert(orderId);
  }, []);

  const handleAcceptUrgentOrder = (orderId) => {
    console.log(`[ORDER ALERT] Accept Order clicked: #${orderId}`);
    // Stop buzzer for this order (if other orders remain, buzzer keeps playing)
    stopOrderAlert(orderId);

    // Remove from queue
    setUrgentOrderQueue((prevQueue) =>
      prevQueue.filter((item) => String(item.orderId).trim() !== String(orderId).trim())
    );

    setIsAdminOpen(true);
    const targetUrl = orderId && orderId !== 'New' && orderId !== 'new'
      ? `/admin?tab=orders&acceptOrder=${encodeURIComponent(orderId)}`
      : '/admin?tab=orders';
    window.history.pushState({ modal: 'admin' }, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleViewUrgentOrder = (orderId) => {
    console.log(`[ORDER ALERT] View Order clicked: #${orderId}`);
    // Stop buzzer for this order (if other orders remain, buzzer keeps playing)
    stopOrderAlert(orderId);

    // Remove from queue
    setUrgentOrderQueue((prevQueue) =>
      prevQueue.filter((item) => String(item.orderId).trim() !== String(orderId).trim())
    );

    setIsAdminOpen(true);
    const targetUrl = orderId && orderId !== 'New' && orderId !== 'new'
      ? `/admin?tab=orders&acceptOrder=${encodeURIComponent(orderId)}`
      : '/admin?tab=orders';
    window.history.pushState({ modal: 'admin' }, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // After login/register: if a checkout was pending, open the checkout modal
  useEffect(() => {
    if (isAuthenticated && checkoutRedirectPending) {
      setCheckoutRedirectPending(false);
      setTimeout(() => setIsCheckoutOpen(true), 150);
    }
  }, [isAuthenticated, checkoutRedirectPending, setCheckoutRedirectPending, setIsCheckoutOpen]);

  // Global Firebase Cloud Messaging (FCM) Foreground Listener
  useEffect(() => {
    let unsubscribe = () => {};
    setupForegroundFcmListener((alertData) => {
      console.log('🔔 [FCM CLIENT] Foreground order message received:', alertData);
      if (alertData?.type === 'ACCEPT_ORDER' || alertData?.type === 'ORDER_ACCEPTED') {
        handleAcceptUrgentOrder(alertData.orderId);
        return;
      }
      if (alertData?.type === 'VIEW_ORDER' || alertData?.type === 'ORDER_VIEWED') {
        handleViewUrgentOrder(alertData.orderId);
        return;
      }
      if (alertData?.orderId) {
        enqueueNewOrderAlert(alertData);
      }
    }).then((unsub) => {
      if (typeof unsub === 'function') unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [enqueueNewOrderAlert]);

  // Local window event listener: immediately catches new orders placed in the application
  useEffect(() => {
    const handleLocalNewOrder = (event) => {
      const order = event.detail;
      if (!order || !order.orderId) return;

      console.log('⚡ [ORDER EVENT] Incoming New Order detected:', order.orderId);
      enqueueNewOrderAlert({
        orderId: order.orderId,
        customerName: order.customer?.name || order.customer?.fullName || 'Valued Customer',
        customerPhone: order.customer?.phone || '',
        customerAddress: [order.customer?.address, order.customer?.area, order.customer?.landmark]
          .filter(Boolean)
          .join(', '),
        items: order.items || [],
        itemsCount: String(order.items?.length || 1),
        totalAmount: String(order.totalAmount || 0),
        paymentMethod: order.paymentMethod || 'COD',
        orderDate: order.orderDate || order.createdAt || new Date().toISOString()
      });
    };

    window.addEventListener('quickfit_new_order', handleLocalNewOrder);
    return () => window.removeEventListener('quickfit_new_order', handleLocalNewOrder);
  }, [enqueueNewOrderAlert]);

  // Bi-directional URL Synchronization & Route Protection
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isAuth = Boolean(user && (token || localStorage.getItem('quickfit_token')));

      // GUEST-FIRST: No longer block unauthenticated users from the homepage.
      // Login/Register are accessible at /login and /register, but NOT forced on guests.

      // If user is already authenticated and visits /login or /register, redirect to /
      if (isAuth && (path === '/login' || path === '/login/' || path === '/register' || path === '/register/')) {
        window.history.replaceState({ modal: 'home' }, '', '/');
        setCurrentPath('/');
        return;
      }

      setCurrentPath(path);

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
        if (path === '/admin/login' || path === '/admin/login/') {
          window.history.replaceState({ modal: 'admin' }, '', '/admin');
        } else if (!path.startsWith('/admin')) {
          window.history.pushState({ modal: 'admin' }, '', '/admin');
        }
      } else {
        if (!path.startsWith('/admin')) {
          window.history.pushState({ modal: 'admin_login' }, '', '/admin/login');
        }
      }
    }
  }, [isAdminOpen, isAdminAuthenticated, isAuthenticated]);

  const handleCloseAuth = () => {
    window.history.replaceState({ modal: 'home' }, '', '/');
    setCurrentPath('/');
  };

  const handleNavigateHome = () => {
    window.history.pushState({ modal: 'home' }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    setCurrentPath('/');
  };

  // Determine which route/overlay to show
  const isLoginPath    = currentPath === '/login'    || currentPath === '/login/';
  const isRegisterPath = currentPath === '/register' || currentPath === '/register/';
  const isSearchPage   = currentPath.startsWith('/search');
  const searchQueryParam = new URLSearchParams(window.location.search).get('q') || '';
  const isCategoryPage = currentPath.startsWith('/category');
  const categorySlug   = currentPath.replace(/^\/category\/?/, '').replace(/\/$/, '') || 'shirts';

  // ─── FULL STOREFRONT (accessible to ALL users — guest & authenticated) ───────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">

      {/* LOGIN / REGISTER OVERLAY — shown as a full-screen layer over the homepage
          when the user navigates to /login or /register.
          Guests land here only when they try to checkout, not on first visit. */}
      {isLoginPath && (
        <LoginPage onClose={handleCloseAuth} />
      )}
      {isRegisterPath && (
        <RegisterPage onClose={handleCloseAuth} />
      )}

      {/* PUBLIC STICKY NAVBAR WITH USER PROFILE */}
      <Navbar />

      {/* RENDER DEDICATED SEARCH RESULTS PAGE, DEDICATED CATEGORY PAGE, OR HOMEPAGE COLLECTIONS */}
      {isSearchPage ? (
        <SearchResultsPage
          queryParam={searchQueryParam}
          onNavigateHome={handleNavigateHome}
        />
      ) : isCategoryPage ? (
        <CategoryPage
          slug={categorySlug}
          onNavigateHome={handleNavigateHome}
        />
      ) : (
        <>
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
        </>
      )}

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
      <UrgentOrderAlertModal
        orderAlert={currentUrgentAlert}
        pendingCount={urgentOrderQueue.length}
        onAccept={handleAcceptUrgentOrder}
        onView={handleViewUrgentOrder}
      />

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
