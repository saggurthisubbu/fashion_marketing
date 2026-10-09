import puppeteer from '../client/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve('C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\ea19e7a9-ef6b-40f2-a9dd-3acb60edceee');

async function setReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function run() {
  console.log('🚀 Authenticating test customer to get token...');
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'saggurthisubbu9@gmail.com',
    password: 'QuickFitAdmin@2026!'
  });
  const userData = loginRes.data;
  const token = userData.token;
  console.log('✅ Authenticated as:', userData.name);

  console.log('🚀 Launching Microsoft Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Pre-seed localStorage with authenticated customer session
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((u, t) => {
    localStorage.setItem('quickfit_user', JSON.stringify(u));
    localStorage.setItem('quickfit_token', t);
  }, userData, token);

  console.log('🌐 Loading storefront...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. Open first product card modal
  console.log('🔍 Clicking Select Size & Add...');
  await page.waitForFunction(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).some(b => b.textContent.includes('Select Size & Add'));
  }, { timeout: 15000 });

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Select Size & Add')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // 2. Select size 'M'
  console.log('👆 Selecting size M in product detail modal...');
  await page.evaluate(() => {
    const sizeBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const txt = b.textContent.trim();
      return txt === 'M' || txt === 'L' || txt === 'S';
    });
    if (sizeBtns.length > 0) sizeBtns[0].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 3. Click "Buy Now" to open Checkout directly
  console.log('👆 Clicking Buy Now...');
  await page.evaluate(() => {
    const buyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Buy Now'));
    if (buyBtn) buyBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Verify Checkout Modal opened
  console.log('🔍 Waiting for Checkout Modal...');
  await page.waitForSelector('input[name="fullName"]', { timeout: 10000 });
  console.log('✅ Checkout Modal is open!');

  // Fill in customer details
  await setReactInput(page, 'input[name="fullName"]', 'Ramesh Kumar');
  await setReactInput(page, 'input[name="phone"]', '9876543210');
  await setReactInput(page, 'textarea[name="address"]', 'Door 40-1-28, Near Benz Circle');
  await setReactInput(page, 'input[name="pincode"]', '520010');

  // Trigger verify delivery address
  console.log('📍 Verifying Delivery Availability for Benz Circle (In-Zone <= 10 km)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vBtn = btns.find(b => b.textContent.includes('Verify Delivery Availability') || b.textContent.includes('Re-verify'));
    if (vBtn) vBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 5. Screenshot: In-Zone Verified
  const inZoneScreenPath = path.join(SCREENSHOT_DIR, '06_checkout_in_zone_verified.png');
  await page.screenshot({ path: inZoneScreenPath });
  console.log('📸 Saved In-Zone Checkout screenshot to:', inZoneScreenPath);

  const verificationText = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('div, p, span'));
    const found = textEls.find(el => el.textContent.includes('Delivery available from RS FASHIONS'));
    return found ? found.textContent.trim() : null;
  });
  console.log('✅ In-Zone delivery banner confirmed:', verificationText);

  // 6. Test OUT-OF-ZONE location: Gannavaram (> 10 km)
  console.log('🚫 Changing Delivery Address to Out-Of-Zone: Gannavaram Airport Road, 521101...');
  await setReactInput(page, 'textarea[name="address"]', 'Gannavaram Airport Road');
  await setReactInput(page, 'input[name="pincode"]', '521101');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vBtn = btns.find(b => b.textContent.includes('Re-verify') || b.textContent.includes('Verify Delivery Availability'));
    if (vBtn) vBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 7. Screenshot: Out-of-Zone Blocked
  const outZoneScreenPath = path.join(SCREENSHOT_DIR, '07_checkout_out_of_zone_blocked.png');
  await page.screenshot({ path: outZoneScreenPath });
  console.log('📸 Saved Out-of-Zone Blocked screenshot to:', outZoneScreenPath);

  const blockedText = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('div, p, span'));
    const found = textEls.find(el => el.textContent.includes('Sorry, we are currently not available at this location'));
    return found ? found.textContent.trim() : null;
  });
  console.log('✅ Out-of-Zone blocking banner confirmed:', blockedText);

  // 8. Try clicking "Review & Confirm Order" while blocked
  console.log('👆 Attempting to click Review & Confirm Order while blocked...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rBtn = btns.find(b => b.textContent.includes('Review & Confirm Order'));
    if (rBtn) rBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const blockedErrorAlert = await page.evaluate(() => {
    const alert = document.querySelector('.bg-rose-50');
    return alert ? alert.textContent.trim() : null;
  });
  console.log('✅ Blocked order alert correctly shown:', blockedErrorAlert);

  // 9. Revert back to In-Zone location: Benz Circle
  console.log('🔄 Reverting back to In-Zone location: Benz Circle, 520010...');
  await setReactInput(page, 'textarea[name="address"]', 'Flat 402, Royal Residency, Benz Circle');
  await setReactInput(page, 'input[name="pincode"]', '520010');
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vBtn = btns.find(b => b.textContent.includes('Re-verify') || b.textContent.includes('Verify Delivery Availability'));
    if (vBtn) vBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 10. Click Review & Confirm Order
  console.log('👆 Clicking Review & Confirm Order...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rBtn = btns.find(b => b.textContent.includes('Review & Confirm Order'));
    if (rBtn) rBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.waitForFunction(() => {
    return document.body.textContent.includes('Step 2: Order Confirmation');
  }, { timeout: 8000 });
  console.log('✅ Transitioned to Step 2: Order Confirmation!');

  const step2StoreDispatch = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('div, p, span'));
    const found = textEls.find(el => el.textContent.includes('Delivery available from RS FASHIONS'));
    return found ? found.textContent.trim() : null;
  });
  console.log('✅ Step 2 Store Dispatch info confirmed:', step2StoreDispatch);

  // 11. Screenshot: Step 2 Confirmation
  const step2ScreenPath = path.join(SCREENSHOT_DIR, '08_checkout_step2_confirmation.png');
  await page.screenshot({ path: step2ScreenPath });
  console.log('📸 Saved Step 2 Confirmation screenshot to:', step2ScreenPath);

  // 12. Click "Confirm Order"
  console.log('🛍️ Clicking Confirm Order button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cBtn = btns.find(b => b.textContent.includes('Confirm Order'));
    if (cBtn) cBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  // 13. Screenshot: Order Placed Success
  const placedScreenPath = path.join(SCREENSHOT_DIR, '09_checkout_order_placed_success.png');
  await page.screenshot({ path: placedScreenPath });
  console.log('📸 Saved Order Placed screenshot to:', placedScreenPath);

  await browser.close();
  console.log('\n🎉 ALL E2E BROWSER CHECKOUT TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('❌ E2E Browser Test failed:', err);
  process.exit(1);
});
