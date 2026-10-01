import '../config/env.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { DeviceToken } from '../models/DeviceToken.js';

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK using modern modular API
function initFirebaseAdmin() {
  if (isFirebaseInitialized || getApps().length > 0) {
    isFirebaseInitialized = true;
    return true;
  }

  try {
    // 1. Check for FIREBASE_SERVICE_ACCOUNT JSON string in environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        console.log('✅ [FCM] Firebase Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT environment variable');
        return true;
      } catch (parseErr) {
        console.warn('⚠️ [FCM] FIREBASE_SERVICE_ACCOUNT is set but could not be parsed as JSON:', parseErr.message);
      }
    }

    // 2. Check for individual environment variables: PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY
    const rawProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (rawProjectId && rawClientEmail && rawPrivateKey) {
      const projectId = rawProjectId.replace(/["']/g, '').trim();
      const clientEmail = rawClientEmail.replace(/["']/g, '').trim();
      let privateKey = rawPrivateKey.trim();

      if (privateKey.startsWith('"') && (privateKey.endsWith('",') || privateKey.endsWith('"'))) {
        privateKey = privateKey.replace(/^"|"[,]?$/g, '');
      }
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      isFirebaseInitialized = true;
      console.log(`✅ [FCM] Firebase Admin SDK initialized for project "${projectId}" via environment variables`);
      return true;
    }

    // 3. Check for serviceAccountKey.json file in server directory or root
    const potentialPaths = [
      path.resolve('server/serviceAccountKey.json'),
      path.resolve('serviceAccountKey.json'),
      path.resolve('server/firebase-service-account.json'),
      path.resolve('firebase-service-account.json')
    ];

    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        const fileContent = JSON.parse(fs.readFileSync(p, 'utf8'));
        initializeApp({
          credential: cert(fileContent)
        });
        isFirebaseInitialized = true;
        console.log(`✅ [FCM] Firebase Admin SDK initialized via local file: ${p}`);
        return true;
      }
    }

    console.log('ℹ️ [FCM] Firebase Admin credentials not yet provided in .env. FCM push service is standing by in mock/preview mode.');
    return false;
  } catch (err) {
    console.error('❌ [FCM Init Error]:', err.message);
    return false;
  }
}

// Ensure init is attempted at startup
initFirebaseAdmin();

/**
 * Send instant FCM push notification to all admin and store-owner devices
 * Supports Android phones, iOS devices (Safari PWA/APNs), and desktop browsers
 *
 * @param {Object} order - The newly created order document
 */
export async function sendFcmOrderNotification(order) {
  if (!order) return { success: false, reason: 'no_order_provided' };

  const rawOrder = typeof order.toObject === 'function' ? order.toObject() : order;

  const orderId = rawOrder.orderId || rawOrder._id?.toString() || 'New';
  const customerName = rawOrder.customer?.name || rawOrder.customer?.fullName || 'Customer';
  const customerPhone = rawOrder.customer?.phone || '';
  const customerAddress = [
    rawOrder.customer?.address,
    rawOrder.customer?.landmark,
    rawOrder.customer?.area,
    rawOrder.customer?.pincode
  ].filter(Boolean).join(', ') || rawOrder.customer?.address || 'Vijayawada';
  const totalAmount = rawOrder.totalAmount || 0;
  const itemsCount = Array.isArray(rawOrder.items) ? rawOrder.items.length : 1;
  const paymentMethod = rawOrder.paymentMethod || 'COD';
  const orderDate = String(rawOrder.orderDate || rawOrder.createdAt || new Date().toISOString());
  const serializedItems = JSON.stringify(Array.isArray(rawOrder.items) ? rawOrder.items : []);
  const targetUrl = `/admin?tab=orders&acceptOrder=${encodeURIComponent(orderId)}`;

  const notificationTitle = `🔔 NEW ORDER: #${orderId}`;
  const notificationBody = `₹${totalAmount} from ${customerName} (${itemsCount} item${itemsCount === 1 ? '' : 's'}) via ${paymentMethod} | ${customerAddress}`;

  console.log(`\n🔔 [FCM PUSH TRIGGER] Preparing instant push notification for Order #${orderId}...`);

  try {
    // 1. Find all active tokens registered for admin and store owners
    const tokensDocs = await DeviceToken.find({
      role: { $in: ['admin', 'store_owner'] }
    });

    if (!tokensDocs || tokensDocs.length === 0) {
      console.log(`ℹ️ [FCM] No registered admin device tokens found in database. Notification will appear on next admin login.`);
      return { success: false, reason: 'no_registered_tokens' };
    }

    const tokens = tokensDocs.map(t => t.token).filter(Boolean);
    console.log(`📲 [FCM] Found ${tokens.length} registered device token(s) (Android / iOS / Web).`);

    const initialized = initFirebaseAdmin();
    if (!initialized) {
      console.log(`ℹ️ [FCM] Simulated push notification to ${tokens.length} device(s):`);
      console.log(`   Title: ${notificationTitle}`);
      console.log(`   Body:  ${notificationBody}`);
      console.log(`   Note: Add FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID & FIREBASE_PRIVATE_KEY to .env for live cloud delivery.`);
      return { success: true, simulated: true, count: tokens.length };
    }

    const messaging = getMessaging();

    // 2. Prepare comprehensive FCM Multicast Message with Android & iOS sound & complete order details
    const message = {
      tokens,
      notification: {
        title: notificationTitle,
        body: notificationBody
      },
      data: {
        orderId: String(orderId),
        totalAmount: String(totalAmount),
        customerName: String(customerName),
        customerPhone: String(customerPhone),
        customerAddress: String(customerAddress),
        items: serializedItems,
        itemsCount: String(itemsCount),
        paymentMethod: String(paymentMethod),
        orderDate: String(orderDate),
        type: 'new_order',
        url: targetUrl,
        click_action: targetUrl
      },
      // Android specific configuration (high priority, vibration, custom channel)
      android: {
        priority: 'high',
        notification: {
          channelId: 'quickfit_orders',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationPriority: 'PRIORITY_MAX',
          clickAction: targetUrl,
          tag: `order_${orderId}`,
          icon: 'ic_launcher'
        }
      },
      // iOS / APNs specific configuration (critical alert, sound, badge)
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody
            },
            sound: 'default',
            badge: 1
          }
        }
      },
      // Web Push configuration (for Chrome/Edge on Android and Safari on iOS PWA)
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          sound: '/audio/order_notification.mp3',
          requireInteraction: true,
          tag: `order_${orderId}`,
          renotify: true,
          vibrate: [500, 250, 500, 250, 500],
          actions: [
            { action: 'view_order', title: '👁 VIEW ORDER' },
            { action: 'accept_order', title: '✅ ACCEPT ORDER' }
          ],
          data: {
            url: targetUrl,
            orderId: String(orderId),
            customerName: String(customerName),
            customerPhone: String(customerPhone),
            customerAddress: String(customerAddress),
            items: serializedItems,
            itemsCount: String(itemsCount),
            totalAmount: String(totalAmount),
            paymentMethod: String(paymentMethod),
            orderDate: String(orderDate)
          }
        },
        fcmOptions: {
          link: targetUrl
        }
      }
    };

    // 3. Send message via FCM
    const response = await messaging.sendEachForMulticast(message);
    console.log(`[FCM ORDER] Firebase accepted message: ${response.successCount} succeeded, ${response.failureCount} failed.`);
    console.log(`🚀 [FCM SUCCESS] Sent notification: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // 4. Clean up invalid/expired tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await DeviceToken.deleteMany({ token: { $in: tokensToRemove } });
        console.log(`🧹 [FCM CLEANUP] Removed ${tokensToRemove.length} expired FCM token(s).`);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error('❌ [FCM Send Error]:', err.message);
    return { success: false, error: err.message };
  }
}
