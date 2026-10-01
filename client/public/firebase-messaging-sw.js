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

    const orderId = payload.data?.orderId || 'new';
    const customerName = payload.data?.customerName || '';
    const totalAmount = payload.data?.totalAmount || '';
    const itemsCount = payload.data?.itemsCount || '1';

    const title = payload.notification?.title || payload.data?.title || `🔔 NEW ORDER: #${orderId}`;
    let body = payload.notification?.body || payload.data?.body;
    if (!body || body.includes('A new order has been placed')) {
      body = `₹${totalAmount} from ${customerName} (${itemsCount} item${itemsCount === '1' ? '' : 's'})`;
    }

    const notificationOptions = {
      body: body,
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: payload.notification?.badge || '/icons/icon-192x192.png',
      image: payload.notification?.image || undefined,
      tag: `order_${orderId}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500],
      actions: [
        { action: 'accept_order', title: '✅ ACCEPT ORDER' }
      ],
      data: {
        url: payload.data?.url || '/admin',
        orderId: orderId,
        customerName: customerName,
        totalAmount: totalAmount,
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

    const orderId = rawData.data?.orderId || rawData.orderId || 'new';
    const customerName = rawData.data?.customerName || '';
    const totalAmount = rawData.data?.totalAmount || '';
    const itemsCount = rawData.data?.itemsCount || '1';

    const title = rawData.notification?.title || rawData.data?.title || rawData.title || `🔔 NEW ORDER: #${orderId}`;
    let body = rawData.notification?.body || rawData.data?.body || rawData.body;
    if (!body || body.includes('New order received') || body.includes('New order placed')) {
      body = `₹${totalAmount} from ${customerName} (${itemsCount} item${itemsCount === '1' ? '' : 's'})`;
    }

    const options = {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `order_${orderId}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500],
      actions: [
        { action: 'accept_order', title: '✅ ACCEPT ORDER' }
      ],
      data: {
        url: rawData.data?.url || '/admin',
        orderId: orderId,
        customerName: customerName,
        totalAmount: totalAmount
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const textData = event.data.text();
    console.log('[FCM SW] Raw text push received:', textData);
    event.waitUntil(
      self.registration.showNotification('🔔 NEW ORDER', {
        body: textData || 'Check your QuickFit Admin Dashboard.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        requireInteraction: true,
        actions: [{ action: 'accept_order', title: '✅ ACCEPT ORDER' }],
        data: { url: '/admin' }
      })
    );
  }
});

// Handle notification click on phone (Android / iOS / Desktop)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId || 'new';
  const isAccept = event.action === 'accept_order';
  const targetUrl = orderId && orderId !== 'new' && orderId !== 'New'
    ? `/admin?tab=orders&acceptOrder=${encodeURIComponent(orderId)}`
    : '/admin?tab=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Post message to active browser tabs/PWA to stop sound & vibration and open order
      for (const client of windowClients) {
        if ('postMessage' in client) {
          client.postMessage({
            type: 'ACCEPT_ORDER',
            orderId: orderId,
            action: event.action
          });
        }
      }

      // 2. If admin window is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl).catch(() => {});
          }
          return client.focus();
        }
      }
      // 3. Otherwise open the Admin Dashboard
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
