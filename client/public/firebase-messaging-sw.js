// QuickFit - Firebase Cloud Messaging Service Worker
// Supports background push notifications on Android phones, iOS 16.4+ (PWA), and Desktop browsers

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Standard Firebase Client Configuration
// This can be customized via VITE_FIREBASE_* environment variables during build
const firebaseConfig = {
  apiKey: "AIzaSyD8Tm1LhTUeP3TV7VdNkDEBIkrrl89mo9s",
  authDomain: "quickfit-notifications.firebaseapp.com",
  projectId: "quickfit-notifications",
  storageBucket: "quickfit-notifications.firebasestorage.app",
  messagingSenderId: "686924877659",
  appId: "1:686924877659:web:2e7900911ce7338ec4947e"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] background message received:', payload);

    const title = payload.notification?.title || payload.data?.title || '🛍️ New Order Received!';
    const body = payload.notification?.body || payload.data?.body || 'A new order has been placed on QuickFit.';
    const orderId = payload.data?.orderId || 'new';

    const notificationOptions = {
      body: body,
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: payload.notification?.badge || '/icons/icon-192x192.png',
      image: payload.notification?.image || undefined,
      tag: `order_${orderId}`,
      renotify: true,
      data: {
        url: payload.data?.url || '/admin',
        orderId: orderId,
        click_action: payload.data?.click_action || '/admin'
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn('[FCM SW] Firebase init in SW notice:', e.message);
}

// Fallback generic Push event listener (handles direct webpush payloads when not processed by SDK)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const rawData = event.data.json();
    console.log('[FCM SW] background message received (push event):', rawData);

    // If already handled by Firebase messaging SDK or if it has notification block, ensure display
    const title = rawData.notification?.title || rawData.data?.title || rawData.title || '🛍️ New Order Placed!';
    const body = rawData.notification?.body || rawData.data?.body || rawData.body || 'New order received on QuickFit Admin.';
    const orderId = rawData.data?.orderId || rawData.orderId || 'new';

    const options = {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `order_${orderId}`,
      renotify: true,
      data: {
        url: rawData.data?.url || '/admin',
        orderId: orderId
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const textData = event.data.text();
    console.log('[FCM SW] Raw text push received:', textData);
    event.waitUntil(
      self.registration.showNotification('🛍️ New Order Received!', {
        body: textData || 'Check your QuickFit Admin Dashboard.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: { url: '/admin' }
      })
    );
  }
});

// Handle notification click on phone (Android / iOS / Desktop)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If admin window is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window to the Admin Dashboard
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
