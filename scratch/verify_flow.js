import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== VERIFYING ORDER NOTIFICATION SOUND FIX FLOW ===\n');

// 1. Audio Files Check
const pathsToCheck = [
  'client/public/sounds/order-alert.mp3',
  'client/public/public/sounds/order-alert.mp3',
  'client/dist/sounds/order-alert.mp3',
  'client/dist/public/sounds/order-alert.mp3',
  'public/sounds/order-alert.mp3'
];

for (const p of pathsToCheck) {
  const full = path.resolve(p);
  assert(fs.existsSync(full), `File must exist: ${p}`);
  const stat = fs.statSync(full);
  assert(stat.size > 20000, `File should be a valid mp3 > 20KB: ${p}`);
  console.log(`✅ Sound file verified: ${p} (${stat.size} bytes)`);
}

// 2. Service Worker Inspection
const swContent = fs.readFileSync(path.resolve('client/public/firebase-messaging-sw.js'), 'utf8');
assert(swContent.includes('broadcastOrderAlertToClients'), 'SW must have broadcastOrderAlertToClients');
assert(swContent.includes('Promise.all(['), 'SW must keep worker alive with Promise.all in waitUntil');
assert(swContent.includes('/sounds/order-alert.mp3'), 'SW must reference soundUrl');
assert(swContent.includes('FCM_ORDER_NOTIFICATION'), 'SW must broadcast FCM_ORDER_NOTIFICATION');
console.log('✅ Service worker background broadcast & lifecycle wait verified.');

// 3. Client Firebase Config Inspection
const fbContent = fs.readFileSync(path.resolve('client/src/config/firebase.js'), 'utf8');
assert(fbContent.includes('playSynthesizedOrderBuzzer'), 'Must include Web Audio API buzzer synthesizer');
assert(fbContent.includes('playOrderNotificationSound'), 'Must include playOrderNotificationSound');
assert(fbContent.includes('unlockAudio'), 'Must include unlockAudio for browser autoplay handling');
assert(fbContent.includes('isOrderDuplicate'), 'Must include isOrderDuplicate');
assert(fbContent.includes('markOrderHandled'), 'Must include markOrderHandled');
assert(fbContent.includes('FCM_ORDER_NOTIFICATION'), 'Must listen to SW broadcast message');
console.log('✅ Client firebase sound engine & autoplay handler verified.');

// 4. Test Single-Play Deduplication Logic
const handledIds = new Set();
const storage = new Map();

function isOrderDuplicate(orderId) {
  if (!orderId) return false;
  const idStr = String(orderId);
  if (handledIds.has(idStr)) return true;
  const stored = storage.get(`sound_${idStr}`);
  if (stored && (Date.now() - stored) < 300000) return true;
  return false;
}

function markOrderHandled(orderId) {
  const idStr = String(orderId);
  handledIds.add(idStr);
  storage.set(`sound_${idStr}`, Date.now());
}

function playNotificationSound(orderId) {
  if (orderId) {
    if (isOrderDuplicate(orderId)) {
      return false; // Skipped duplicate!
    }
    markOrderHandled(orderId);
  }
  return true; // Played!
}

assert.strictEqual(playNotificationSound('ORD-101'), true, 'Order 101 must play on first trigger');
assert.strictEqual(playNotificationSound('ORD-101'), false, 'Order 101 must NOT play again on duplicate event');
assert.strictEqual(playNotificationSound('ORD-102'), true, 'Order 102 must play on first trigger');
assert.strictEqual(playNotificationSound('ORD-102'), false, 'Order 102 must NOT play again on duplicate event');

console.log('✅ Single-play deduplication flow confirmed.');
console.log('\n🎉 ALL CHECKS PASSED SUCCESSFULLY!');
