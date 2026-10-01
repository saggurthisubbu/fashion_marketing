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
 * Play the custom order notification chime and trigger phone vibration
 */
export function playOrderNotificationSound() {
  try {
    // 1. Play audio chime
    const audio = new Audio('/audio/order_notification.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to .wav if browser needs wav format
        const wavAudio = new Audio('/audio/order_notification.wav');
        wavAudio.volume = 1.0;
        wavAudio.play().catch(() => {});
      });
    }

    // 2. Trigger phone vibration (Android & compatible devices)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
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

const foregroundCallbacks = new Set();
let activeForegroundUnsubscribe = null;

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

        // 1. Play alert sound and vibrate
        playOrderNotificationSound();

        // 2. Always show native Notification via Service Worker (works on iOS Safari PWA, Android, and Desktop)
        const title = payload.notification?.title || payload.data?.title || '🛍️ New Order Received!';
        const body = payload.notification?.body || payload.data?.body || 'New order placed on QuickFit.';
        const orderId = payload.data?.orderId || 'new';

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: `order_${orderId}`,
              renotify: true,
              data: {
                url: payload.data?.url || '/admin',
                orderId
              }
            });
            console.log('📲 [FCM CLIENT] notification displayed:', title);
          }).catch((err) => {
            console.warn('⚠️ [FCM CLIENT] Service Worker showNotification error:', err.message);
          });
        }

        // 3. Notify all registered callbacks to update UI
        foregroundCallbacks.forEach((cb) => {
          try {
            cb(payload);
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
