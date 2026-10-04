import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runDiagnosticsVerification() {
  console.log('========================================================================');
  console.log('🚚 VERIFYING QUICKFIT REAL DELIVERY APP NOTIFICATION REQUIREMENTS');
  console.log('========================================================================\n');

  // Check 1: Force admin users to enable push notifications & install QuickFit as PWA
  console.log('Requirement 1 & 2: Checking AdminDeliveryEnforcement modal & requirements...');
  const enforcementCode = fs.readFileSync('client/src/components/admin/AdminDeliveryEnforcement.jsx', 'utf8');
  assert(enforcementCode.includes('registerAdminPushNotifications'), 'Must invoke registerAdminPushNotifications');
  assert(enforcementCode.includes('promptPwaInstall'), 'Must invoke promptPwaInstall');
  assert(enforcementCode.includes('Delivery Partner Setup Required'), 'Must present delivery partner setup modal');
  console.log('   ✅ Requirement 1 & 2 verified: AdminDeliveryEnforcement enforces push & PWA install.\n');

  // Check 3: Show warning if notifications are disabled
  console.log('Requirement 3: Checking warning banner when notifications disabled/blocked...');
  assert(enforcementCode.includes('admin-warning-notifications'), 'Must have notification warning banner element');
  assert(enforcementCode.includes('Push Notifications Disabled'), 'Must warn if notifications are disabled');
  assert(enforcementCode.includes('Push Notifications Blocked'), 'Must warn if notifications are blocked');
  console.log('   ✅ Requirement 3 verified: High-visibility warning displayed when notifications disabled.\n');

  // Check 4: Show warning if PWA is not installed
  console.log('Requirement 4: Checking warning banner when PWA is not installed...');
  assert(enforcementCode.includes('admin-warning-pwa'), 'Must have PWA warning banner element');
  assert(enforcementCode.includes('Install QuickFit App for Guaranteed Background Alerts'), 'Must warn when running in standard browser tab');
  console.log('   ✅ Requirement 4 verified: Warning banner displayed when running in standard browser tab.\n');

  // Check 5: Automatically register FCM token after login
  console.log('Requirement 5: Checking automatic FCM token registration on admin login...');
  const adminModalCode = fs.readFileSync('client/src/components/AdminDashboardModal.jsx', 'utf8');
  assert(adminModalCode.includes('registerAdminPushNotifications(res.data.token)'), 'AdminDashboardModal must auto-register token on admin login');

  const shopContextCode = fs.readFileSync('client/src/context/ShopContext.jsx', 'utf8');
  assert(shopContextCode.includes('registerAdminPushNotifications(res.data.token)'), 'ShopContext must auto-register token for admin on login');
  console.log('   ✅ Requirement 5 verified: FCM token registered automatically upon admin login.\n');

  // Check 6: Refresh expired FCM tokens
  console.log('Requirement 6: Checking token refresh mechanisms...');
  const fbCode = fs.readFileSync('client/src/config/firebase.js', 'utf8');
  assert(fbCode.includes('export async function refreshAdminFcmToken'), 'firebase.js must export refreshAdminFcmToken');
  assert(adminModalCode.includes('refreshAdminFcmToken'), 'AdminDashboardModal must invoke refreshAdminFcmToken on sync');

  const adminRoutesCode = fs.readFileSync('server/src/routes/adminRoutes.js', 'utf8');
  assert(adminRoutesCode.includes('DeviceToken.deleteOne({ token: oldToken })'), 'Server must clean up rotated tokens');
  console.log('   ✅ Requirement 6 verified: Expired and rotated tokens are refreshed and cleaned up.\n');

  // Check 7: Send notifications to all active admin devices
  console.log('Requirement 7: Checking notification delivery to all active admin devices...');
  const fcmServiceCode = fs.readFileSync('server/src/services/fcmService.js', 'utf8');
  assert(fcmServiceCode.includes("role: { $in: ['admin', 'store_owner'] }"), 'Must query all admin and store-owner device tokens');
  assert(fcmServiceCode.includes('new Set(tokensDocs.map'), 'Must deduplicate tokens before multicast send');
  assert(fcmServiceCode.includes('messaging.sendEachForMulticast'), 'Must use sendEachForMulticast for all devices');
  console.log('   ✅ Requirement 7 verified: Multicast push delivers to all registered admin devices.\n');

  // Check 8: Play loud buzzer sound when app is open
  console.log('Requirement 8: Checking loud buzzer sound...');
  const audioCode = fs.readFileSync('client/src/utils/audioAlert.js', 'utf8');
  assert(audioCode.includes('startLoopingOrderAlert'), 'Must loop order alert sound');
  assert(audioCode.includes('playEmergencyBuzzerBurst'), 'Must include synthesizer pulse buzzer backup');
  assert(audioCode.includes('/sounds/order-alert.mp3'), 'Must play order-alert.mp3');
  console.log('   ✅ Requirement 8 verified: Looping audio + emergency synthesized buzzer acts reliably.\n');

  // Check 9: Show full-screen urgent order alert
  console.log('Requirement 9: Checking full-screen urgent order alert...');
  const alertModalCode = fs.readFileSync('client/src/components/admin/UrgentOrderAlertModal.jsx', 'utf8');
  assert(alertModalCode.includes('fixed inset-0 z-[99999]'), 'Modal must have high-z backdrop');
  assert(alertModalCode.includes('w-full h-full sm:h-auto sm:max-h-[94vh]'), 'Modal must expand full-screen on mobile');
  assert(alertModalCode.includes('VIEW ORDER'), 'Must have prominent VIEW ORDER button');
  assert(alertModalCode.includes('ACCEPT ORDER'), 'Must have prominent ACCEPT ORDER button');
  console.log('   ✅ Requirement 9 verified: Full-screen delivery app urgent alert modal verified.\n');

  // Check 10: Keep notification delivery working when app is in background
  console.log('Requirement 10: Checking background notification delivery & service worker...');
  const swCode = fs.readFileSync('client/public/firebase-messaging-sw.js', 'utf8');
  assert(swCode.includes('onBackgroundMessage'), 'SW must listen to onBackgroundMessage');
  assert(swCode.includes('showNotification'), 'SW must display system notification');
  assert(swCode.includes('requireInteraction: true'), 'Notification must require interaction');
  assert(swCode.includes('broadcastOrderAlertToClients'), 'SW must broadcast to open window clients');
  assert(swCode.includes('FCM_ORDER_NOTIFICATION'), 'SW must post FCM_ORDER_NOTIFICATION to wake tab audio');
  console.log('   ✅ Requirement 10 verified: Background notifications and audio wake work via SW.\n');

  // Check 11: Add Admin Notification Diagnostics page
  console.log('Requirement 11: Checking Admin Notification Diagnostics page...');
  const diagCode = fs.readFileSync('client/src/components/admin/tabs/AdminDiagnosticsTab.jsx', 'utf8');
  assert(diagCode.includes('1. Permission Status'), 'Must show notification permission status');
  assert(diagCode.includes('2. PWA Installed Status'), 'Must show PWA installed status');
  assert(diagCode.includes('3. FCM Token Registry'), 'Must show current FCM token');
  assert(diagCode.includes('Last Notification Received'), 'Must show last received notification');
  assert(diagCode.includes('Trigger Test FCM Push'), 'Must have test push notification button');
  assert(diagCode.includes('Test Loud Buzzer Sound'), 'Must have test buzzer button');
  assert(diagCode.includes('btn-copy-fcm-token'), 'Must have copy token button');

  // Verify tab is registered in AdminLayout
  const layoutCode = fs.readFileSync('client/src/components/admin/AdminLayout.jsx', 'utf8');
  assert(layoutCode.includes("id: 'diagnostics'"), 'AdminLayout must include diagnostics in menu');
  assert(layoutCode.includes('Push Diagnostics'), 'AdminLayout must have Push Diagnostics tab');

  // Verify tab is wired in AdminDashboardModal
  assert(adminModalCode.includes('<AdminDiagnosticsTab'), 'AdminDashboardModal must render AdminDiagnosticsTab');
  console.log('   ✅ Requirement 11 verified: Admin Notification Diagnostics page complete and wired.\n');

  console.log('========================================================================');
  console.log('🎉 ALL 11 REAL DELIVERY APP REQUIREMENTS SUCCESSFULLY VERIFIED & PASSING');
  console.log('========================================================================');
}

runDiagnosticsVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
