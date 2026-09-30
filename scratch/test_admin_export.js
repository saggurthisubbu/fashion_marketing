import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

console.log('getApps():', getApps());
console.log('getMessaging is function:', typeof getMessaging === 'function');
