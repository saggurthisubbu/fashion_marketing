import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve('server/.env') });

import { verifyDeliveryAddress, haversineDistance, RS_FASHIONS_LOCATION } from '../client/src/utils/deliveryRadius.js';
import { connectDB } from '../server/src/config/db.js';
import { Order } from '../server/src/models/Order.js';
import { Store } from '../server/src/models/Store.js';
import { Product } from '../server/src/models/Product.js';

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 TESTING QUICKFIT DELIVERY-LOCATION LOGIC & COMPLETE ORDER FLOW');
  console.log('========================================================================\n');

  await connectDB();

  // Test 1: Verify RS FASHIONS store exists in DB
  console.log('--- TEST 1: RS FASHIONS Store in MongoDB ---');
  const rsStore = await Store.findOne({ name: /RS FASHION/i });
  console.log('Found Store:', rsStore ? `${rsStore.name} | ${rsStore.address} | coords: ${rsStore.location.lat}, ${rsStore.location.lng} | radius: ${rsStore.deliveryRadiusKm}km` : 'None');
  if (!rsStore) throw new Error('RS FASHIONS store not found in MongoDB');
  console.log('✅ RS FASHIONS store confirmed in database.\n');

  // Test 2: Unit verification for In-Zone areas (within 10 km)
  console.log('--- TEST 2: Delivery Verification for IN-ZONE Areas (<= 10 km) ---');
  const inZoneTests = [
    { area: 'Benz Circle', address: 'Door 40-1-28, MG Road' },
    { area: 'Patamata', address: 'Near High School Road' },
    { area: 'Governorpet', address: 'Prakasam Road' },
    { area: 'Labbipet', address: 'Opposite Gateway Hotel' },
    { area: 'Devi Nagar', address: 'Main Bazar' }
  ];

  for (const test of inZoneTests) {
    const res = await verifyDeliveryAddress(test, 'http://localhost:5000/api');
    console.log(`📍 ${test.area}: distance = ${res.distanceKm} km | inZone = ${res.inZone} | message = "${res.message}"`);
    if (!res.inZone) throw new Error(`Expected ${test.area} to be within 10 km!`);
    if (res.message !== '⚡ Delivery available from RS FASHIONS') {
      throw new Error(`Unexpected message for ${test.area}: ${res.message}`);
    }
  }
  console.log('✅ All In-Zone areas properly verified within 10 km of RS FASHIONS.\n');

  // Test 3: Unit verification for OUT-OF-ZONE areas (> 10 km)
  console.log('--- TEST 3: Delivery Verification for OUT-OF-ZONE Areas (> 10 km) ---');
  const outZoneTests = [
    { area: 'Gannavaram', address: 'Airport Road' },
    { area: 'Kankipadu', address: 'Near Bus Stand' },
    { area: 'Guntur', address: 'Brodipet' },
    { area: 'Hyderabad', address: 'Banjara Hills' }
  ];

  for (const test of outZoneTests) {
    const res = await verifyDeliveryAddress(test, 'http://localhost:5000/api');
    console.log(`🚫 ${test.area}: distance = ${res.distanceKm} km | inZone = ${res.inZone} | message = "${res.message}"`);
    if (res.inZone) throw new Error(`Expected ${test.area} to be outside 10 km!`);
    if (res.message !== 'Sorry, we are currently not available at this location.') {
      throw new Error(`Unexpected message for ${test.area}: ${res.message}`);
    }
  }
  console.log('✅ All Out-Of-Zone areas properly blocked.\n');

  // Test 4: Backend API blocking orders outside 10 km
  console.log('--- TEST 4: Backend POST /api/orders Blocks Orders > 10 km ---');
  const product = await Product.findOne({ inStock: true });
  if (!product) throw new Error('No in-stock product found for test');

  try {
    await axios.post('http://localhost:5000/api/orders', {
      customer: {
        name: 'Test Customer Out-of-zone',
        phone: '9876543210',
        email: 'test-out@example.com',
        address: 'Gannavaram Airport Road',
        area: 'Gannavaram',
        pincode: '521101'
      },
      customerLocation: { lat: 16.5414, lng: 80.7963 }, // Gannavaram: ~16 km from RS FASHIONS
      customerLatitude: 16.5414,
      customerLongitude: 80.7963,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1, size: 'M' }],
      totalAmount: product.price,
      paymentMethod: 'COD'
    });
    throw new Error('Backend should have rejected order outside 10 km zone!');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.message?.includes('Sorry, we are currently not available at this location.')) {
      console.log('✅ Backend correctly rejected out-of-zone order with 400 Bad Request:');
      console.log('   Response message:', err.response.data.message);
      console.log('   Distance calculated:', err.response.data.distanceKm, 'km\n');
    } else {
      throw err;
    }
  }

  // Test 5: Backend API allowing order within 10 km & saving all Rapido destination details
  console.log('--- TEST 5: Backend POST /api/orders Allows In-Zone Order & Saves Rapido Destination ---');
  const orderRes = await axios.post('http://localhost:5000/api/orders', {
    customer: {
      name: 'Subbu Saggurthi (Rapido Test)',
      phone: '7396629821',
      email: 'saggurthisubbu9@gmail.com',
      address: 'Flat 402, Royal Residency, Benz Circle',
      landmark: 'Near Sweet Magic',
      area: 'Benz Circle',
      pincode: '520010'
    },
    customerLocation: { lat: 16.4984418, lng: 80.6526978 }, // Benz Circle: ~3.97 km from RS FASHIONS
    customerLatitude: 16.4984418,
    customerLongitude: 80.6526978,
    locationLink: 'https://www.google.com/maps?q=16.4984418,80.6526978',
    deliveryDistanceKm: 3.97,
    deliveryAddress: 'Flat 402, Royal Residency, Benz Circle, Landmark: Near Sweet Magic, Pincode: 520010, Vijayawada',
    items: [{ product: product._id, name: product.name, price: product.price, quantity: 1, size: 'L' }],
    totalAmount: product.price,
    paymentMethod: 'UPI (GPay/PhonePe)'
  });

  const createdOrder = orderRes.data;
  console.log('✅ Order created successfully! ID:', createdOrder.orderId);

  // Verify in MongoDB
  const dbOrder = await Order.findOne({ orderId: createdOrder.orderId });
  console.log('MongoDB Order Record:');
  console.log('  - Order ID:', dbOrder.orderId);
  console.log('  - Customer Name:', dbOrder.customer.name);
  console.log('  - Customer Address:', dbOrder.customer.address);
  console.log('  - Delivery Address:', dbOrder.deliveryAddress);
  console.log('  - Customer Destination Lat/Lng:', `${dbOrder.customerLocation?.lat}, ${dbOrder.customerLocation?.lng}`);
  console.log('  - Location Link (Google Maps for Rapido):', dbOrder.locationLink);
  console.log('  - Assigned Store:', dbOrder.assignedStore?.name);
  console.log('  - Delivery Distance:', `${dbOrder.assignedStore?.distanceKm} km (deliveryDistanceKm: ${dbOrder.deliveryDistanceKm} km)`);

  if (!dbOrder.assignedStore?.name?.includes('RS FASHION')) {
    throw new Error('Assigned store is not RS FASHIONS');
  }
  if (!dbOrder.customerLocation?.lat || !dbOrder.customerLocation?.lng) {
    throw new Error('Customer destination GPS was not saved');
  }
  if (!dbOrder.locationLink || !dbOrder.locationLink.includes('maps')) {
    throw new Error('Location link for Rapido was not saved');
  }

  console.log('\n🎉 ALL LOGIC AND BACKEND VERIFICATION CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
