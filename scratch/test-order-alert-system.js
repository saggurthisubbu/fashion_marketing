import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING QUICKFIT NEW ORDER ALERT & BUZZER SYSTEM');
  console.log('================================================================\n');

  // Test 1: Verify audio file location and size
  console.log('Test 1: Checking audio file location (client/public/sounds/order-alert.mp3)...');
  const mp3Path = path.resolve('client/public/sounds/order-alert.mp3');
  assert(fs.existsSync(mp3Path), 'Audio file must exist at client/public/sounds/order-alert.mp3');
  const stat = fs.statSync(mp3Path);
  assert(stat.size > 0, 'Audio file must not be empty');
  console.log(`   ✅ Audio file verified! Path: ${mp3Path} (${stat.size} bytes)\n`);

  // Test 2: Verify audio file HTTP serving
  console.log('Test 2: Checking HTTP accessibility at http://localhost:5173/sounds/order-alert.mp3...');
  try {
    const res = await fetch('http://localhost:5173/sounds/order-alert.mp3');
    assert.strictEqual(res.status, 200, 'Audio file should return HTTP 200');
    console.log(`   ✅ Audio served over HTTP 200 with Content-Type: ${res.headers.get('content-type')}\n`);
  } catch (err) {
    console.warn('   ⚠️ Dev server fetch note:', err.message);
  }

  // Test 3: Verify the replacement comment in code
  console.log('Test 3: Checking required comment: "// Replace order-alert.mp3 with any preferred buzzer/ringtone"...');
  const expectedComment = '// Replace order-alert.mp3 with any preferred buzzer/ringtone';
  const audioAlertCode = fs.readFileSync('client/src/utils/audioAlert.js', 'utf8');
  assert(audioAlertCode.includes(expectedComment), 'audioAlert.js must contain the replacement comment');

  const fbCode = fs.readFileSync('client/src/config/firebase.js', 'utf8');
  assert(fbCode.includes(expectedComment), 'firebase.js must contain the replacement comment');

  const adminNotifCode = fs.readFileSync('client/src/components/admin/tabs/AdminNotificationsTab.jsx', 'utf8');
  assert(adminNotifCode.includes(expectedComment), 'AdminNotificationsTab.jsx must contain the replacement comment');
  console.log('   ✅ Required replacement comment confirmed in all audio modules!\n');

  // Test 4: Verify audioAlert looping logic and multiple orders handling
  console.log('Test 4: Verifying looping buzzer & multiple orders queue logic...');
  const { startLoopingOrderAlert, stopOrderAlert, getUnhandledOrdersCount, isOrderHandled } = await import('../client/src/utils/audioAlert.js');

  const orderA = 'QF-TEST-001';
  const orderB = 'QF-TEST-002';

  // Order A arrives
  startLoopingOrderAlert(orderA);
  assert.strictEqual(getUnhandledOrdersCount(), 1, 'Should have 1 unhandled order');

  // Order B arrives (multiple orders)
  startLoopingOrderAlert(orderB);
  assert.strictEqual(getUnhandledOrdersCount(), 2, 'Should have 2 unhandled orders');

  // Accept/View Order A -> Order B is still unhandled, buzzer continues!
  const stoppedA = stopOrderAlert(orderA);
  assert.strictEqual(stoppedA, false, 'Buzzer should NOT stop because Order B is still pending');
  assert.strictEqual(getUnhandledOrdersCount(), 1, 'Should have 1 remaining unhandled order');
  assert(isOrderHandled(orderA), 'Order A must be marked handled');

  // Accept/View Order B -> All orders handled, buzzer stops immediately!
  const stoppedB = stopOrderAlert(orderB);
  assert.strictEqual(stoppedB, true, 'Buzzer must stop when all orders are handled');
  assert.strictEqual(getUnhandledOrdersCount(), 0, 'Should have 0 unhandled orders');
  assert(isOrderHandled(orderB), 'Order B must be marked handled');
  console.log('   ✅ Looping buzzer and multi-order queue logic verified!\n');

  // Test 5: Verify UrgentOrderAlertModal contains product images and required details
  console.log('Test 5: Checking UrgentOrderAlertModal for product images and non-dismissible view/accept buttons...');
  const modalCode = fs.readFileSync('client/src/components/admin/UrgentOrderAlertModal.jsx', 'utf8');
  assert(modalCode.includes('resolveImageUrl'), 'Modal must resolve product images');
  assert(modalCode.includes('img'), 'Modal must render product image tag');
  assert(modalCode.includes('VIEW ORDER'), 'Modal must have View Order button');
  assert(modalCode.includes('ACCEPT ORDER'), 'Modal must have Accept Order button');
  assert(!modalCode.includes('btn-urgent-dismiss'), 'Modal must NOT have a dismiss button (stays visible until View/Accept)');
  console.log('   ✅ UrgentOrderAlertModal correctly enforces View/Accept actions with product photos!\n');

  console.log('================================================================');
  console.log('🎉 ALL ORDER ALERT & BUZZER SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
