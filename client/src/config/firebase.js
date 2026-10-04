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

// Web Audio API Context for zero-latency, reliable buzzer sound
let audioCtx = null;
let audioUnlocked = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesize loud clear order alert buzzer via Web Audio API (100% reliable, zero network dependency)
 * Plays a clear 2-burst buzzer + chime: Beep (880Hz) -> Beep (1175Hz) -> Chime (1760Hz)
 */
export function playSynthesizedOrderBuzzer() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Beep 1: 880Hz punchy buzz (0.0 to 0.18s)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Beep 2: 1175Hz higher alert buzz (0.24 to 0.44s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1175, now + 0.24);
    gain2.gain.setValueAtTime(0.001, now + 0.24);
    gain2.gain.exponentialRampToValueAtTime(0.55, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.24);
    osc2.stop(now + 0.44);

    // Chime: 1760Hz bell tone (0.48 to 1.3s)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1760, now + 0.48);
    gain3.gain.setValueAtTime(0.001, now + 0.48);
    gain3.gain.exponentialRampToValueAtTime(0.5, now + 0.49);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.48);
    osc3.stop(now + 1.3);
  } catch (err) {
    console.warn('[Synthesizer Notice]:', err?.message);
  }
}

// Replace order-alert.mp3 with any preferred buzzer/ringtone
import { startLoopingOrderAlert, stopOrderAlert } from '../utils/audioAlert';

/**
 * Play the loud looping buzzer/ringtone for an incoming order
 * Continues looping until View Order or Accept Order is clicked.
 */
export function playOrderNotificationSound(orderId) {
  // Replace order-alert.mp3 with any preferred buzzer/ringtone
  return startLoopingOrderAlert(orderId);
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
    localStorage.setItem('quickfit_fcm_token_synced_at', new Date().toISOString());
    localStorage.setItem('quickfit_notifications_enabled', 'true');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickfit_fcm_token_changed', { detail: { token: fcmToken } }));
    }

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

/**
 * Refresh expired or rotating FCM Device Token and re-sync with server
 * @param {string} authToken
 * @returns {Promise<{success: boolean, token?: string, isNew?: boolean, error?: string}>}
 */
export async function refreshAdminFcmToken(authToken) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Push notifications are not supported in this browser' };
  }

  try {
    if (Notification.permission !== 'granted') {
      return { success: false, error: 'Notification permission is not granted' };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      throw new Error('Firebase Messaging could not be initialized in this browser.');
    }

    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => null);
    }

    const options = {
      serviceWorkerRegistration: swRegistration || undefined
    };
    if (VAPID_KEY) {
      options.vapidKey = VAPID_KEY;
    }

    const currentSavedToken = localStorage.getItem('quickfit_fcm_token');
    const fcmToken = await getToken(messaging, options);

    if (!fcmToken) {
      throw new Error('Could not acquire fresh FCM device token.');
    }

    const isNew = currentSavedToken !== fcmToken;
    const deviceType = getDeviceType();

    localStorage.setItem('quickfit_fcm_token', fcmToken);
    localStorage.setItem('quickfit_fcm_token_synced_at', new Date().toISOString());
    localStorage.setItem('quickfit_notifications_enabled', 'true');

    const tokenPayload = {
      token: fcmToken,
      oldToken: isNew ? currentSavedToken : undefined,
      deviceType,
      platform: navigator.platform || '',
      userAgent: navigator.userAgent || ''
    };

    const tokenHeader = authToken || localStorage.getItem('quickfit_token');
    if (tokenHeader) {
      await axios.post(`${API_BASE_URL}/admin/notifications/fcm-token`, tokenPayload, {
        headers: { Authorization: `Bearer ${tokenHeader}` }
      });
      console.log(`🔄 [FCM REFRESH] Token verified & synced with backend (${isNew ? 'Rotated New Token' : 'Existing Token Confirmed'})`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickfit_fcm_token_changed', { detail: { token: fcmToken } }));
    }

    return { success: true, token: fcmToken, isNew, deviceType };
  } catch (err) {
    console.error('❌ [FCM Refresh Error]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Record a received notification in localStorage for the diagnostics dashboard
 */
export function recordReceivedNotification(data) {
  if (typeof window === 'undefined') return;
  try {
    const record = {
      ...data,
      receivedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    localStorage.setItem('quickfit_last_notification', JSON.stringify(record));

    let history = [];
    try {
      const existing = localStorage.getItem('quickfit_notification_history');
      if (existing) history = JSON.parse(existing);
      if (!Array.isArray(history)) history = [];
    } catch { history = []; }

    history.unshift(record);
    if (history.length > 25) history = history.slice(0, 25);
    localStorage.setItem('quickfit_notification_history', JSON.stringify(history));

    window.dispatchEvent(new CustomEvent('quickfit_notification_received', { detail: record }));
  } catch (e) {
    console.warn('[FCM] recordReceivedNotification notice:', e.message);
  }
}

/**
 * Get the most recently received notification from storage
 */
export function getLastReceivedNotification() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('quickfit_last_notification');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get notification history from storage
 */
export function getNotificationHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('quickfit_notification_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Order Alert Deduplication and Cross-Tab Synchronization
const handledOrderIds = new Set();
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
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const silentAudio = new Audio('/sounds/order-alert.mp3');
    silentAudio.volume = 0.001;
    const p = silentAudio.play();
    if (p !== undefined) {
      p.then(() => {
        silentAudio.pause();
        silentAudio.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
    } else {
      audioUnlocked = true;
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'pointerdown', 'keydown'];
  const onFirstInteraction = () => {
    unlockAudio();
    events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
  };
  events.forEach((evt) => window.addEventListener(evt, onFirstInteraction, { once: true, passive: true }));
}

/**
 * Start the urgent order alert (plays clear buzzer sound once per order)
 */
export function startUrgentOrderAlert(orderId) {
  playOrderNotificationSound(orderId);
}

/**
 * Stop persistent order alert audio and vibration immediately
 */
export function stopUrgentOrderAlert(orderId) {
  stopOrderAlert(orderId);
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

      // Play clear buzzer sound immediately once (deduplication handled internally)
      playOrderNotificationSound(orderId);

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

      // Record for diagnostics page and history
      recordReceivedNotification({
        orderId,
        customerName: alertData.customerName,
        customerPhone: alertData.customerPhone,
        customerAddress: alertData.customerAddress,
        itemsCount: alertData.itemsCount,
        totalAmount: alertData.totalAmount,
        paymentMethod: alertData.paymentMethod,
        orderDate: alertData.orderDate,
        title: `🔔 NEW ORDER: #${orderId}`,
        body: `₹${alertData.totalAmount} from ${alertData.customerName}`,
        source: 'Service Worker Background Push'
      });

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

        // Required explicit logs
        console.log(`[FCM ORDER CLIENT] New order notification received`);
        console.log(`[FCM ORDER CLIENT] Order ID: ${orderId}`);
        console.log(`[FCM ORDER CLIENT] Showing urgent order alert`);

        // Play clear buzzer alert sound once (deduplication handled internally)
        playOrderNotificationSound(orderId);

        // Display native persistent notification with action buttons where supported
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

        // Notify all registered callbacks to display the urgent in-app modal
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

        // Record for diagnostics page and history
        recordReceivedNotification({
          orderId,
          customerName,
          customerPhone,
          customerAddress,
          itemsCount,
          totalAmount,
          paymentMethod,
          orderDate,
          title: urgentTitle,
          body: urgentBody,
          source: 'FCM Foreground Push'
        });

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


