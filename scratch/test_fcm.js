import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

import mongoose from '../server/node_modules/mongoose/index.js';
import { sendFcmOrderNotification } from '../server/src/services/fcmService.js';
import { DeviceToken } from '../server/src/models/DeviceToken.js';

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function testFcm() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected successfully, readyState:', mongoose.connection.readyState);

  // Register a test admin device token
  await DeviceToken.findOneAndUpdate(
    { token: 'sample_admin_phone_token_android_test' },
    {
      role: 'admin',
      token: 'sample_admin_phone_token_android_test',
      deviceType: 'android',
      platform: 'Android',
      userAgent: 'Mozilla/5.0 (Linux; Android 14) QuickFit/1.0',
      lastActive: new Date()
    },
    { upsert: true }
  );
  console.log('Registered sample test device token.');

  const testOrder = {
    orderId: 'QF-TEST-777888',
    totalAmount: 2499,
    customer: {
      name: 'Subbu Fashion Admin',
      phone: '+91 7396629821',
      address: 'Benz Circle, MG Road, Vijayawada'
    },
    items: [
      { name: 'Monochrome Heavyweight Oversized Tee', price: 2499, quantity: 1 }
    ],
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    deliveryStatus: 'Confirmed'
  };

  const res = await sendFcmOrderNotification(testOrder);
  console.log('FCM Notification Result:', res);

  // Clean up test token
  await DeviceToken.deleteOne({ token: 'sample_admin_phone_token_android_test' });
  console.log('Cleaned up test token.');

  await mongoose.disconnect();
}

testFcm();
