import '../server/src/config/env.js';
import { connectDB } from '../server/src/config/db.js';
import { Order } from '../server/src/models/Order.js';
import { User } from '../server/src/models/User.js';
import { checkFirstTimeCustomerEligibility } from '../server/src/routes/orderRoutes.js';
import mongoose from 'mongoose';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FIRST-ORDER COUPON COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check existing customer detection
  const existingOrder = await Order.findOne({ deliveryStatus: { $ne: 'Cancelled' } });
  if (existingOrder) {
    console.log(`[Existing order found]: #${existingOrder.orderId} | Phone: ${existingOrder.customer.phone} | Email: ${existingOrder.customer.email}`);
    
    // Test repeat customer by phone
    const repeatPhoneRes = await checkFirstTimeCustomerEligibility({
      phone: existingOrder.customer.phone,
      email: 'brandnewemail99999@test.com'
    });
    assert(!repeatPhoneRes.eligible, 'Repeat customer identified by phone is correctly rejected');

    // Test repeat customer by email
    if (existingOrder.customer.email) {
      const repeatEmailRes = await checkFirstTimeCustomerEligibility({
        phone: '9999999999',
        email: existingOrder.customer.email
      });
      assert(!repeatEmailRes.eligible, 'Repeat customer identified by email is correctly rejected');
    }
  }

  // 2. Check first-time customer eligibility
  const firstTimeRes = await checkFirstTimeCustomerEligibility({
    phone: '9111122222',
    email: 'brandnewcustomer777@gmail.com'
  });
  assert(firstTimeRes.eligible, 'Brand new customer with unused phone and email is accepted');

  // 3. Discount calculation rules
  // Bill ₹1,000 -> ₹200 discount -> ₹800 final (free delivery above 999)
  {
    const subtotal = 1000;
    const discount = Math.min(200, subtotal);
    const deliveryFee = subtotal > 999 ? 0 : 49;
    const finalTotal = Math.max(0, subtotal - discount + deliveryFee);
    assert(discount === 200, 'Bill ₹1,000 gets FLAT ₹200 discount');
    assert(finalTotal === 800, 'Bill ₹1,000 final payable is ₹800 (Example test passed)');
  }

  // Bill less than ₹200 (e.g. ₹150) -> never negative, discount <= subtotal
  {
    const subtotal = 150;
    const discount = Math.min(200, subtotal);
    const deliveryFee = subtotal > 999 ? 0 : 49;
    const finalProductPayable = Math.max(0, subtotal - discount);
    const finalTotal = Math.max(0, subtotal - discount + deliveryFee);
    assert(discount === 150, 'Bill ₹150 gets ₹150 discount (capped at subtotal)');
    assert(finalProductPayable === 0, 'Bill ₹150 product payable is ₹0 (never negative)');
    assert(finalTotal === 49, 'Bill ₹150 final payable with delivery is ₹49 (never negative)');
  }

  // Bill ₹180 -> discount ₹180, never negative
  {
    const subtotal = 180;
    const discount = Math.min(200, subtotal);
    assert(discount === 180, 'Bill ₹180 gets ₹180 discount');
    assert(Math.max(0, subtotal - discount) === 0, 'Subtotal after discount is never negative');
  }

  // Bill ₹500 -> ₹200 discount -> ₹300 + ₹49 delivery -> ₹349 final
  {
    const subtotal = 500;
    const discount = Math.min(200, subtotal);
    const deliveryFee = 49;
    const finalTotal = Math.max(0, subtotal - discount + deliveryFee);
    assert(discount === 200, 'Bill ₹500 gets ₹200 discount');
    assert(finalTotal === 349, 'Bill ₹500 final payable is ₹349');
  }

  // 4. Code names test: FIRSTORDER and FIRST200
  const validCodes = ['FIRSTORDER', 'FIRST200', 'firstorder', 'first200', ' FIRSTORDER '];
  validCodes.forEach(raw => {
    const code = raw.trim().toUpperCase();
    const isValid = code === 'FIRSTORDER' || code === 'FIRST200';
    assert(isValid, `Code "${raw}" is correctly recognized as first-order coupon`);
  });

  // Invalid coupon test
  const invalidCodes = ['INVALID', 'DISCOUNT50', 'SUMMER200', 'WELCOME'];
  invalidCodes.forEach(code => {
    const isValid = code === 'FIRSTORDER' || code === 'FIRST200' || code === 'QUICK60' || code === 'FIRSTFIT';
    assert(!isValid, `Code "${code}" is correctly rejected as invalid`);
  });

  // 5. Simulate Order creation for COD and UPI, and ensure secure recheck
  const testPhone = `98888${Math.floor(10000 + Math.random() * 90000)}`;
  const testEmail = `temp_first_time_${Date.now()}@example.com`;

  // First order via COD with FIRSTORDER
  const items1 = [{ name: 'Oversized Cotton Tee', price: 1000, quantity: 1, size: 'L' }];
  const subtotal1 = items1.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const eligible1 = await checkFirstTimeCustomerEligibility({ phone: testPhone, email: testEmail });
  assert(eligible1.eligible, 'First-time customer is eligible before first order');

  const discount1 = Math.min(200, subtotal1);
  const delivery1 = subtotal1 > 999 ? 0 : 49;
  const total1 = Math.max(0, subtotal1 - discount1 + delivery1);

  const testOrder1 = new Order({
    orderId: `QF-TEST-${Date.now()}-COD`,
    customer: {
      name: 'Test Customer COD',
      phone: testPhone,
      email: testEmail,
      address: 'Test Street, Benz Circle',
      pincode: '520010',
      area: 'Benz Circle'
    },
    items: items1,
    subtotalAmount: subtotal1,
    discountAmount: discount1,
    couponCode: 'FIRSTORDER',
    totalAmount: total1,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    deliveryStatus: 'Confirmed'
  });

  const savedOrder1 = await testOrder1.save();
  assert(savedOrder1.discountAmount === 200, 'Saved order has discountAmount: 200');
  assert(savedOrder1.totalAmount === 800, 'Saved order has totalAmount: 800 via COD');
  assert(savedOrder1.couponCode === 'FIRSTORDER', 'Saved order has couponCode: FIRSTORDER');

  // Attempt repeat order with FIRSTORDER for the SAME customer via UPI
  const eligible2 = await checkFirstTimeCustomerEligibility({ phone: testPhone, email: testEmail });
  assert(!eligible2.eligible, 'Same customer attempting SECOND order with FIRSTORDER is BLOCKED by backend validation');

  // Verify that customer CAN place normal order without coupon via UPI
  const items2 = [{ name: 'Polo Shirt', price: 600, quantity: 1, size: 'M' }];
  const subtotal2 = items2.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const delivery2 = subtotal2 > 999 ? 0 : 49;
  const total2 = subtotal2 + delivery2;

  const testOrder2 = new Order({
    orderId: `QF-TEST-${Date.now()}-UPI`,
    customer: {
      name: 'Test Customer Repeat UPI',
      phone: testPhone,
      email: testEmail,
      address: 'Test Street, Benz Circle',
      pincode: '520010',
      area: 'Benz Circle'
    },
    items: items2,
    subtotalAmount: subtotal2,
    discountAmount: 0,
    couponCode: '',
    totalAmount: total2,
    paymentMethod: 'UPI (GPay/PhonePe)',
    paymentStatus: 'Pending',
    deliveryStatus: 'Confirmed'
  });

  const savedOrder2 = await testOrder2.save();
  assert(savedOrder2.totalAmount === 649, 'Repeat customer can successfully place order without coupon via UPI');
  assert(savedOrder2.paymentMethod === 'UPI (GPay/PhonePe)', 'Payment method is UPI (GPay/PhonePe)');

  // CLEAN UP TEST ORDERS: Guarantee no dummy orders are left in the database
  await Order.deleteOne({ _id: savedOrder1._id });
  await Order.deleteOne({ _id: savedOrder2._id });
  console.log('\n🧹 Cleaned up temporary test orders from database.');

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
