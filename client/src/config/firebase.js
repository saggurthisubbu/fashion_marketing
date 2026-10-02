import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import axios from 'axios';
import { API_BASE_URL } from './api';

const clean = (val, fallback = '') => {
  if (!val) return fallback;
  return String(val).replace(/^["']|["']$/g, '').trim();
};

// Firebase Client Configuration
// Reads from Vite environment variables (VITE_FIREBASE_*) with real fallback
export const firebaseConfig = {
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyD8Tm1LhTUeP3TV7VdNkDEBIkrrl89mo9s"),
  authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "quickfit-notifications.firebaseapp.com"),
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID, "quickfit-notifications"),
  storageBucket: clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "quickfit-notifications.firebasestorage.app"),
  messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "686924877659"),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID, "1:686924877659:web:2e7900911ce7338ec4947e")
};

// Web Push VAPID Key (reads from Vite env or fallback)
export const VAPID_KEY = clean(import.meta.env.VITE_FIREBASE_VAPID_KEY, "BOkm1LnRJRk_iRoo4Jv5BmNMxzSfSx5bDGc8N9imyg6hevdw-354Yvx0SP48nOeZmE2yk0wA0wPECsRCsb9IB1w") || undefined;

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messagingInstance = null;

export async function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
    console.warn('⚠️ [FCM] Firebase Messaging is not supported on this browser or context.');
    return null;
  } catch (err) {
    console.warn('⚠️ [FCM] Could not initialize messaging instance:', err.message);
    return null;
  }
}

/**
 * Play the loud order notification sound (/public/sounds/order-alert.mp3) and trigger phone vibration
 */
export function playOrderNotificationSound(orderId) {
  if (orderId && isOrderDuplicate(orderId)) {
    console.log(`ℹ️ [Audio Alert] Skipping duplicate sound for order: ${orderId}`);
    return;
  }
  if (orderId) {
    markOrderHandled(orderId);
  }

  try {
    // 1. Play loud order alert sound (using /public/sounds/order-alert.mp3)
    const audio = new Audio('/public/sounds/order-alert.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Audio Alert] Primary /public/sounds failed, trying fallback:', err?.message);
        // Fallback to /sounds/order-alert.mp3
        const fallbackAudio = new Audio('/sounds/order-alert.mp3');
        fallbackAudio.volume = 1.0;
        fallbackAudio.play().catch(() => {
          const wavAudio = new Audio('/sounds/order-alert.wav');
          wavAudio.volume = 1.0;
          wavAudio.play().catch(() => {
            const legacyAudio = new Audio('/audio/order_notification.mp3');
            legacyAudio.volume = 1.0;
            legacyAudio.play().catch(() => {});
          });
        });
      });
    }

    // 2. Trigger phone vibration (Android & compatible devices)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  } catch (err) {
    console.warn('[Audio Alert Notice]:', err.message);
  }
}

/**
 * Detect whether the client is on Android, iOS, or Desktop
 */
export function getDeviceType() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'web';
}

/**
 * Request notification permission from the administrator and register FCM device token
 *
 * @param {string} authToken - Admin's Bearer authentication token
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function registerAdminPushNotifications(authToken) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Push notifications are not supported in this browser' };
  }

  try {
    // 1. Request permission if not already granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('⚠️ [FCM] Notification permission was not granted by admin:', permission);
      return { success: false, permission, error: 'Notification permission denied by browser.' };
    }

    console.log('✅ [FCM] Notification permission granted!');

    // 2. Register Service Worker and ensure it is ready
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ [FCM] Service Worker registered at scope:', swRegistration.scope);
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('⚠️ [FCM] Service Worker registration note:', swErr.message);
        swRegistration = await navigator.serviceWorker.ready.catch(() => null);
      }
    }

    // 3. Acquire GENUINE FCM Token using Firebase Messaging and VAPID key
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      throw new Error('Firebase Messaging is not supported or could not be initialized in this browser.');
    }

    const options = {
      serviceWorkerRegistration: swRegistration || undefined
    };
    if (VAPID_KEY) {
      options.vapidKey = VAPID_KEY;
    }

    const fcmToken = await getToken(messaging, options);

    if (!fcmToken) {
      throw new Error('No FCM registration token received from Firebase. Ensure VAPID key is configured.');
    }

    console.log('📲 [FCM] Received Genuine FCM Device Registration Token:', fcmToken);

    localStorage.setItem('quickfit_fcm_token', fcmToken);
    localStorage.setItem('quickfit_notifications_enabled', 'true');

    // 4. Send genuine token to backend API
    const deviceType = getDeviceType();
    const tokenPayload = {
      token: fcmToken,
      deviceType,
      platform: navigator.platform || '',
      userAgent: navigator.userAgent || ''
    };

    const tokenHeader = authToken || localStorage.getItem('quickfit_token');
    if (tokenHeader) {
      await axios.post(`${API_BASE_URL}/admin/notifications/fcm-token`, tokenPayload, {
        headers: { Authorization: `Bearer ${tokenHeader}` }
      });
      console.log(`🚀 [FCM] Registered ${deviceType.toUpperCase()} device token with QuickFit server!`);
    }

    return { success: true, token: fcmToken, deviceType };
  } catch (err) {
    console.error('❌ [FCM Registration Error]:', err.message);
    return { success: false, error: err.message };
  }
}

// Urgent Order Alert Audio & Vibration Controller with Cross-Tab Deduplication
let urgentAudio = null;
let urgentAudioInterval = null;
let urgentVibrateInterval = null;
const handledOrderIds = new Set();

// Cross-tab synchronization channel to prevent multiple open tabs from playing duplicate sounds simultaneously
let alertBroadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    alertBroadcastChannel = new BroadcastChannel('quickfit_order_alerts');
    alertBroadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'ORDER_ALERT_PLAYED' && event.data?.orderId) {
        handledOrderIds.add(String(event.data.orderId));
      }
    };
  } catch (e) {}
}

/**
 * Check if sound for the given order was already played within the deduplication window (5 mins)
 */
export function isOrderDuplicate(orderId) {
  if (!orderId) return false;
  const idStr = String(orderId);
  if (handledOrderIds.has(idStr)) return true;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedTime = localStorage.getItem(`quickfit_order_sound_${idStr}`);
      if (storedTime) {
        const elapsed = Date.now() - Number(storedTime);
        if (elapsed < 5 * 60 * 1000) {
          handledOrderIds.add(idStr);
          return true;
        }
      }
    } catch (e) {}
  }
  return false;
}

/**
 * Mark order as handled to prevent duplicate sounds across tabs and events
 */
export function markOrderHandled(orderId) {
  if (!orderId) return;
  const idStr = String(orderId);
  handledOrderIds.add(idStr);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`quickfit_order_sound_${idStr}`, String(Date.now()));
    } catch (e) {}
  }

  if (alertBroadcastChannel) {
    try {
      alertBroadcastChannel.postMessage({
        type: 'ORDER_ALERT_PLAYED',
        orderId: idStr,
        timestamp: Date.now()
      });
    } catch (e) {}
  }

  // Auto clean-up after 5 minutes
  setTimeout(() => {
    handledOrderIds.delete(idStr);
    try {
      localStorage.removeItem(`quickfit_order_sound_${idStr}`);
    } catch (e) {}
  }, 5 * 60 * 1000);
}

// User-interaction audio primer to ensure browser policy allows background/inactive tab audio
let audioUnlocked = false;
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const silentAudio = new Audio('/public/sounds/order-alert.mp3');
    silentAudio.volume = 0.001;
    const p = silentAudio.play();
    if (p !== undefined) {
      p.then(() => {
        silentAudio.pause();
        silentAudio.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'keydown'];
  const onFirstInteraction = () => {
    unlockAudio();
    events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
  };
  events.forEach((evt) => window.addEventListener(evt, onFirstInteraction, { once: true, passive: true }));
}

/**
 * Start the persistent urgent order alert (loud order alert audio loop and vibration)
 * Repeats continuously until the admin views or accepts the order.
 */
export function startUrgentOrderAlert(orderId) {
  if (orderId && isOrderDuplicate(orderId)) {
    console.log(`ℹ️ [Urgent Alert] Duplicate sound loop prevented for order: ${orderId}`);
    return;
  }
  if (orderId) {
    markOrderHandled(orderId);
  }

  stopUrgentOrderAlert();

  try {
    const playAudio = () => {
      try {
        if (!urgentAudio) {
          urgentAudio = new Audio('/public/sounds/order-alert.mp3');
          urgentAudio.volume = 1.0;
          urgentAudio.loop = true;
          // When audio finishes, re-trigger if loop is unsupported on platform
          urgentAudio.addEventListener('ended', () => {
            if (urgentAudio) {
              urgentAudio.play().catch(() => {});
            }
          });
        }
        const playPromise = urgentAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Urgent Alert Audio] Primary /public/sounds failed, trying fallback:', err?.message);
            try {
              if (urgentAudio) {
                urgentAudio = new Audio('/sounds/order-alert.mp3');
                urgentAudio.volume = 1.0;
                urgentAudio.loop = true;
                urgentAudio.play().catch(() => {
                  const legacyAudio = new Audio('/audio/order_notification.mp3');
                  legacyAudio.volume = 1.0;
                  legacyAudio.loop = true;
                  legacyAudio.play().catch(() => {});
                });
              }
            } catch (e) {}
          });
        }
      } catch (e) {}
    };

    // Play immediately
    playAudio();

    // Secondary pulse interval in case browser pauses or cuts off looped audio in background
    urgentAudioInterval = setInterval(() => {
      if (urgentAudio && urgentAudio.paused) {
        urgentAudio.play().catch(() => {});
      }
    }, 2500);

    // Vibrate phone continuously (repeating vibration pulses where supported)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500]);
      urgentVibrateInterval = setInterval(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 250, 500, 250, 500]);
        }
      }, 3000);
    }
  } catch (err) {
    console.warn('[Urgent Alert Start Error]:', err.message);
  }
}

/**
 * Stop persistent order alert audio and vibration immediately
 */
export function stopUrgentOrderAlert() {
  try {
    if (urgentAudio) {
      urgentAudio.pause();
      urgentAudio.currentTime = 0;
      urgentAudio = null;
    }
    if (urgentAudioInterval) {
      clearInterval(urgentAudioInterval);
      urgentAudioInterval = null;
    }
    if (urgentVibrateInterval) {
      clearInterval(urgentVibrateInterval);
      urgentVibrateInterval = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
    }
  } catch (err) {
    console.warn('[Urgent Alert Stop Error]:', err.message);
  }
}

const foregroundCallbacks = new Set();
let activeForegroundUnsubscribe = null;

// Listen for service worker messages:
// 1. Notification action clicks (accept_order or view_order)
// 2. Incoming background order pushes from SW -> plays sound EVEN IF TAB IS INACTIVE
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    // A. Notification click actions
    if (event.data?.type === 'ACCEPT_ORDER' || event.data?.type === 'VIEW_ORDER') {
      const orderId = event.data?.orderId;
      const actionType = event.data?.type;
      console.log(`[FCM ORDER CLIENT] ${actionType === 'ACCEPT_ORDER' ? 'Accept Order' : 'View Order'} clicked: #${orderId}`);
      stopUrgentOrderAlert();
      foregroundCallbacks.forEach((cb) => {
        try {
          cb({ type: actionType, orderId });
        } catch (e) {}
      });
      return;
    }

    // B. Background order notification pushed from Service Worker
    // Plays sound immediately even when the admin dashboard tab is not active / in background
    if (event.data?.type === 'FCM_ORDER_NOTIFICATION') {
      const orderId = event.data?.orderId || event.data?.data?.orderId || `QF-${Date.now()}`;
      console.log(`🔔 [FCM SW MESSAGE] Order alert received via Service Worker: #${orderId}, document.hidden=${typeof document !== 'undefined' ? document.hidden : false}`);

      // Deduplication check: prevent duplicate sounds for the same order
      if (isOrderDuplicate(orderId)) {
        console.log(`ℹ️ [FCM SW MESSAGE] Skipping duplicate alert sound for Order ID: ${orderId}`);
        return;
      }
      markOrderHandled(orderId);

      // Play loud order alert immediately
      startUrgentOrderAlert(orderId);

      // Dispatch to active UI callbacks
      const alertData = {
        orderId,
        customerName: event.data?.data?.customerName || 'Customer',
        customerPhone: event.data?.data?.customerPhone || '',
        customerAddress: event.data?.data?.customerAddress || '',
        items: event.data?.data?.items || [],
        itemsCount: event.data?.data?.itemsCount || '1',
        totalAmount: event.data?.data?.totalAmount || '0',
        paymentMethod: event.data?.data?.paymentMethod || 'COD',
        orderDate: event.data?.data?.orderDate || new Date().toISOString(),
        payload: event.data?.payload
      };

      foregroundCallbacks.forEach((cb) => {
        try {
          cb(alertData);
        } catch (e) {}
      });
    }
  });
}

/**
 * Setup Foreground FCM message listener when Admin is viewing the dashboard or app is open
 */
export async function setupForegroundFcmListener(onNewOrderCallback) {
  try {
    if (typeof onNewOrderCallback === 'function') {
      foregroundCallbacks.add(onNewOrderCallback);
    }

    if (!activeForegroundUnsubscribe) {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return () => {};

      activeForegroundUnsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 [FCM CLIENT] foreground message received:', payload);

        const orderId = payload.data?.orderId || payload.notification?.tag?.replace('order_', '') || `QF-${Date.now()}`;
        const customerName = payload.data?.customerName || 'Customer';
        const customerPhone = payload.data?.customerPhone || '';
        const customerAddress = payload.data?.customerAddress || '';
        let items = [];
        try {
          if (payload.data?.items) {
            items = typeof payload.data.items === 'string' ? JSON.parse(payload.data.items) : payload.data.items;
          }
        } catch (e) {
          items = [];
        }
        const itemsCount = payload.data?.itemsCount || String(items.length || 1);
        const totalAmount = payload.data?.totalAmount || '0';
        const paymentMethod = payload.data?.paymentMethod || 'COD';
        const orderDate = payload.data?.orderDate || new Date().toISOString();

        // Deduplication: prevent repeat alert triggers for the same order within 5 minutes
        if (isOrderDuplicate(orderId)) {
          console.log(`ℹ️ [FCM ORDER CLIENT] Skipping duplicate alert for Order ID: ${orderId}`);
          return;
        }
        markOrderHandled(orderId);

        // Required explicit logs
        console.log(`[FCM ORDER CLIENT] New order notification received`);
        console.log(`[FCM ORDER CLIENT] Order ID: ${orderId}`);
        console.log(`[FCM ORDER CLIENT] Showing urgent order alert`);

        // 1. Start continuous audio chime loop & phone vibration until accepted or viewed
        startUrgentOrderAlert(orderId);

        // 2. Display native persistent notification with action buttons where supported
        const urgentTitle = payload.notification?.title || `🔔 NEW ORDER: #${orderId}`;
        const urgentBody = payload.notification?.body || `₹${totalAmount} from ${customerName} (${itemsCount} items) via ${paymentMethod} | ${customerAddress}`;
        const targetUrl = `/admin?tab=orders&acceptOrder=${encodeURIComponent(orderId)}`;

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(urgentTitle, {
              body: urgentBody,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: `order_${orderId}`,
              renotify: true,
              requireInteraction: true,
              vibrate: [500, 250, 500, 250, 500],
              actions: [
                { action: 'view_order', title: '👁 VIEW ORDER' },
                { action: 'accept_order', title: '✅ ACCEPT ORDER' }
              ],
              data: {
                url: payload.data?.url || targetUrl,
                orderId,
                customerName,
                customerPhone,
                customerAddress,
                items,
                itemsCount,
                totalAmount,
                paymentMethod,
                orderDate
              }
            });
            console.log('📲 [FCM CLIENT] notification displayed:', urgentTitle);
          }).catch((err) => {
            console.warn('⚠️ [FCM CLIENT] Service Worker showNotification error:', err.message);
          });
        }

        // 3. Notify all registered callbacks to display the urgent in-app modal
        const alertData = {
          orderId,
          customerName,
          customerPhone,
          customerAddress,
          items,
          itemsCount,
          totalAmount,
          paymentMethod,
          orderDate,
          payload
        };

        foregroundCallbacks.forEach((cb) => {
          try {
            cb(alertData);
          } catch (e) {
            console.warn('⚠️ [FCM CLIENT] Callback error:', e.message);
          }
        });
      });
    }

    return () => {
      if (typeof onNewOrderCallback === 'function') {
        foregroundCallbacks.delete(onNewOrderCallback);
      }
    };
  } catch (err) {
    console.warn('⚠️ [FCM Foreground Setup Notice]:', err.message);
    return () => {};
  }
}

