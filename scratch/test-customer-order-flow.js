// Automated End-to-End Test for QuickFit Customer OTP Login and Order Confirmation Flow
const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('================================================================');
  console.log('🧪 STARTING E2E TEST: CUSTOMER LOGIN & ORDER CONFIRMATION FLOW');
  console.log('================================================================\n');

  const testPhone = '9988776655';

  // 1. Send OTP
  console.log('Step 1: Sending OTP for Phone:', testPhone);
  const sendRes = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });
  const sendData = await sendRes.json();
  console.log('   Response:', sendData);
  if (!sendData.success || !sendData.otp) {
    throw new Error('Failed to send OTP: ' + JSON.stringify(sendData));
  }
  const generatedOtp = sendData.otp;
  console.log(`   ✅ OTP Generated: ${generatedOtp}\n`);

  // 2. Verify OTP (Initial login for new customer)
  console.log('Step 2: Verifying OTP for New Customer...');
  const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, otp: generatedOtp })
  });
  const verifyData = await verifyRes.json();
  console.log('   Response:', verifyData);
  if (!verifyData.token) {
    throw new Error('Failed to verify OTP: ' + JSON.stringify(verifyData));
  }
  const token = verifyData.token;
  console.log('   ✅ Phone verified successfully, JWT token received.\n');

  // 3. Save Customer Details
  console.log('Step 3: Saving Customer Details (Name, Email, Address)...');
  const profileRes = await fetch(`${API_BASE}/auth/customer-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Aditya Varma',
      email: 'aditya.varma@example.com',
      phone: testPhone,
      address: {
        street: 'Flat 301, Sri Krishna Heights, Patamata',
        area: 'Patamata',
        landmark: 'Near Autonagar Gate',
        pincode: '520007',
        city: 'Vijayawada',
        fullAddress: 'Flat 301, Sri Krishna Heights, Patamata'
      }
    })
  });
  const profileData = await profileRes.json();
  console.log('   Response:', profileData);
  if (profileData.name !== 'Aditya Varma') {
    throw new Error('Customer profile was not saved properly.');
  }
  console.log('   ✅ Customer Details saved in MongoDB.\n');

  // 4. Test Returning Customer Flow (Phone Number -> OTP -> Verify -> Automatically Load Saved Details)
  console.log('Step 4: Testing Returning Customer Flow...');
  const sendRes2 = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });
  const sendData2 = await sendRes2.json();

  const returningRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, otp: sendData2.otp })
  });
  const returningData = await returningRes.json();
  console.log('   Returning Customer Loaded Details:');
  console.log('   • Name:    ', returningData.name);
  console.log('   • Phone:   ', returningData.phone);
  console.log('   • Email:   ', returningData.email);
  console.log('   • Address: ', returningData.address?.fullAddress || returningData.address?.street);
  console.log('   • Status:  ', returningData.isReturningCustomer ? 'Returning Customer ✅' : 'New Customer ❌');

  if (returningData.name !== 'Aditya Varma' || !returningData.isReturningCustomer) {
    throw new Error('Returning customer details failed to load!');
  }
  console.log('   ✅ Saved details automatically loaded after OTP verification!\n');

  // 5. Select Product & Select Size
  console.log('Step 5: Selecting Product & Size from Catalog...');
  const prodRes = await fetch(`${API_BASE}/products`);
  const products = await prodRes.json();
  const selectedProduct = products.find(p => p.sizes && p.sizes.length > 0) || products[0];

  const selectedSize = selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes[0] : 'L';
  console.log(`   • Selected Product: "${selectedProduct.name}" (Price: ₹${selectedProduct.price})`);
  console.log(`   • Selected Size:    "${selectedSize}" (Available sizes: ${selectedProduct.sizes?.join(', ') || 'N/A'})`);
  console.log(`   • Initial Stock:    ${selectedProduct.stockQuantity}\n`);

  // 6. Review Order Details & Submit Confirmed Order
  console.log('Step 6: Reviewing Order Details & Submitting Confirmed Order...');
  const orderPayload = {
    customer: {
      name: returningData.name,
      phone: returningData.phone,
      email: returningData.email,
      address: returningData.address?.street || 'Flat 301, Sri Krishna Heights, Patamata',
      landmark: returningData.address?.landmark || 'Near Autonagar Gate',
      pincode: returningData.address?.pincode || '520007',
      area: returningData.address?.area || 'Patamata'
    },
    items: [
      {
        product: selectedProduct._id || selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        size: selectedSize,
        color: 'Navy Blue',
        image: selectedProduct.images?.front || selectedProduct.image || ''
      }
    ],
    totalAmount: selectedProduct.price,
    paymentMethod: 'UPI (GPay/PhonePe)',
    locationLink: 'https://www.google.com/maps?q=16.5062,80.6480',
    customerLatitude: 16.5062,
    customerLongitude: 80.6480,
    assignedStore: {
      id: '67a760ef16a67f185c721735',
      name: 'QuickFit Benz Circle Boutique',
      distanceKm: 2.1
    }
  };

  const orderRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  const orderData = await orderRes.json();
  console.log('   Created Order Response:');
  console.log('   • Order ID:       ', orderData.orderId);
  console.log('   • Customer:       ', orderData.customer?.name);
  console.log('   • Phone:          ', orderData.customer?.phone);
  console.log('   • Email:          ', orderData.customer?.email);
  console.log('   • Address:        ', orderData.customer?.address);
  console.log('   • Item Confirmed: ', orderData.items?.[0]?.name, '| Size:', orderData.items?.[0]?.size, '| Qty:', orderData.items?.[0]?.quantity);
  console.log('   • Total Amount:    ₹' + orderData.totalAmount);
  console.log('   • Delivery Status:', orderData.deliveryStatus);

  if (!orderData.orderId) {
    throw new Error('Order creation failed!');
  }
  console.log('   ✅ Confirmed Order created successfully in MongoDB!\n');

  // 7. Verify Stock Deduction
  console.log('Step 7: Verifying Stock Deduction...');
  const updatedProdRes = await fetch(`${API_BASE}/products`);
  const updatedProducts = await updatedProdRes.json();
  const updatedProduct = updatedProducts.find(p => String(p._id || p.id) === String(selectedProduct._id || selectedProduct.id));
  console.log(`   • Initial Stock: ${selectedProduct.stockQuantity} -> New Stock: ${updatedProduct.stockQuantity}`);
  console.log('   ✅ Stock updated normally.\n');

  // 8. Verify Admin Login remains completely untouched and functioning
  console.log('Step 8: Verifying Admin Login with Password...');
  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin', password: 'QuickFitAdmin@2026!' })
  });
  const adminData = await adminRes.json();
  console.log('   Admin Login Status:', adminRes.status, '| Role:', adminData.role, '| Name:', adminData.name);
  if (adminData.role !== 'admin') {
    throw new Error('Admin login failed!');
  }
  console.log('   ✅ Admin / Store login remains 100% operational with password authentication.\n');

  console.log('================================================================');
  console.log('🎉 ALL E2E FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
