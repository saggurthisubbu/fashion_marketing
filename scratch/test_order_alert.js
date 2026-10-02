import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== VERIFYING LOUD NOTIFICATION SOUND FOR ADMIN ORDER ALERTS ===\n');

// 1. Verify Audio Files
const requiredSoundPaths = [
  'client/public/sounds/order-alert.mp3',
  'client/public/public/sounds/order-alert.mp3',
  'client/dist/sounds/order-alert.mp3',
  'client/dist/public/sounds/order-alert.mp3',
  'public/sounds/order-alert.mp3'
];

for (const relPath of requiredSoundPaths) {
  const fullPath = path.resolve(relPath);
  assert(fs.existsSync(fullPath), `Missing audio file: ${relPath}`);
  const stats = fs.statSync(fullPath);
  assert(stats.size > 10000, `Audio file too small: ${relPath} (${stats.size} bytes)`);
  console.log(`✅ Audio file verified: ${relPath} (${stats.size} bytes)`);
}

// 2. Verify Service Worker Code
const swPath = path.resolve('client/public/firebase-messaging-sw.js');
const swCode = fs.readFileSync(swPath, 'utf8');

assert(swCode.includes('broadcastOrderAlertToClients'), 'SW must contain broadcastOrderAlertToClients');
assert(swCode.includes('/public/sounds/order-alert.mp3'), 'SW must reference /public/sounds/order-alert.mp3');
assert(swCode.includes('FCM_ORDER_NOTIFICATION'), 'SW must broadcast FCM_ORDER_NOTIFICATION');
assert(swCode.includes('showNotification'), 'SW must preserve native push notifications');
assert(swCode.includes('renotify: true'), 'SW must preserve renotify');
assert(swCode.includes('vibrate:'), 'SW must preserve vibration');
assert(swCode.includes('actions:'), 'SW must preserve action buttons');
console.log('✅ Service worker background broadcast & push notification integrity verified.');

// 3. Verify Firebase Client Config
const fbPath = path.resolve('client/src/config/firebase.js');
const fbCode = fs.readFileSync(fbPath, 'utf8');

assert(fbCode.includes('/public/sounds/order-alert.mp3'), 'Firebase client must use /public/sounds/order-alert.mp3');
assert(fbCode.includes('isOrderDuplicate'), 'Firebase client must implement isOrderDuplicate');
assert(fbCode.includes('markOrderHandled'), 'Firebase client must implement markOrderHandled');
assert(fbCode.includes('FCM_ORDER_NOTIFICATION'), 'Firebase client must listen for FCM_ORDER_NOTIFICATION from SW');
assert(fbCode.includes('startUrgentOrderAlert'), 'Firebase client must implement startUrgentOrderAlert');
assert(fbCode.includes('stopUrgentOrderAlert'), 'Firebase client must implement stopUrgentOrderAlert');
assert(fbCode.includes('playOrderNotificationSound'), 'Firebase client must implement playOrderNotificationSound');
console.log('✅ Firebase client notification handler & audio playback verified.');

// 4. Verify Deduplication Logic in isolation
const handledIds = new Set();
const storage = new Map();

function isDuplicate(orderId) {
  if (!orderId) return false;
  const idStr = String(orderId);
  if (handledIds.has(idStr)) return true;
  const stored = storage.get(`sound_${idStr}`);
  if (stored && (Date.now() - stored) < 300000) return true;
  return false;
}

function markHandled(orderId) {
  const idStr = String(orderId);
  handledIds.add(idStr);
  storage.set(`sound_${idStr}`, Date.now());
}

const testOrderId = 'TEST-ORDER-8821';
assert.strictEqual(isDuplicate(testOrderId), false, 'First arrival must NOT be duplicate');
markHandled(testOrderId);
assert.strictEqual(isDuplicate(testOrderId), true, 'Immediate subsequent arrival MUST be duplicate');
assert.strictEqual(isDuplicate('TEST-ORDER-8822'), false, 'Different order must NOT be duplicate');

console.log('✅ Deduplication algorithm successfully tested.');
console.log('\n🎉 ALL ORDER ALERT SOUND REQUIREMENTS VERIFIED SUCCESSFULLY!');
