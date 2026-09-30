import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import axios from 'axios';
import { API_BASE_URL } from './api';

// Firebase Client Configuration
// Reads from Vite environment variables (VITE_FIREBASE_*) with default fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyQuickFitAdminFCM2026DefaultKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quickfit-fashion.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quickfit-fashion",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quickfit-fashion.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "108392847192",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:108392847192:web:a1b2c3d4e5f6g7h8i9j0k"
};

// Web Push VAPID Key (Optional, can be supplied in .env or defaults to FCM standard)
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

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
    return { success: false, error: 'Notifications are not supported in this browser' };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ [FCM] Notification permission was not granted by admin:', permission);
      return { success: false, permission, error: 'Notification permission denied' };
    }

    console.log('✅ [FCM] Notification permission granted!');

    // 2. Register or fetch Service Worker
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ [FCM] Service Worker registered at scope:', swRegistration.scope);
      } catch (swErr) {
        console.warn('⚠️ [FCM] Service Worker registration note:', swErr.message);
        swRegistration = await navigator.serviceWorker.ready.catch(() => null);
      }
    }

    // 3. Get FCM Token
    const messaging = await getFirebaseMessaging();
    let fcmToken = null;

    if (messaging) {
      try {
        const options = {
          serviceWorkerRegistration: swRegistration || undefined
        };
        if (VAPID_KEY) {
          options.vapidKey = VAPID_KEY;
        }

        fcmToken = await getToken(messaging, options);
        console.log('📲 [FCM] Received Device Registration Token:', fcmToken);
      } catch (tokenErr) {
        console.warn('⚠️ [FCM] getToken notice:', tokenErr.message);
      }
    }

    // Fallback: If Firebase token could not be acquired (e.g. mock project key), generate client device ID
    if (!fcmToken) {
      fcmToken = localStorage.getItem('quickfit_fcm_token') || `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    localStorage.setItem('quickfit_fcm_token', fcmToken);
    localStorage.setItem('quickfit_notifications_enabled', 'true');

    // 4. Send token to backend API so server can deliver push notifications
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

/**
 * Setup Foreground FCM message listener when Admin is viewing the dashboard
 */
export async function setupForegroundFcmListener(onNewOrderCallback) {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('🔔 [FCM FOREGROUND] Push message received in app:', payload);

      // 1. Play alert sound and vibrate
      playOrderNotificationSound();

      // 2. Show native Notification if permission granted and document hidden
      if (document.hidden && Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || '🛍️ New Order Received!';
        const body = payload.notification?.body || payload.data?.body || 'New order placed on QuickFit.';
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [300, 100, 300, 100, 300]
        });
      }

      // 3. Callback to update UI
      if (typeof onNewOrderCallback === 'function') {
        onNewOrderCallback(payload);
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('⚠️ [FCM Foreground Setup Notice]:', err.message);
    return () => {};
  }
}
