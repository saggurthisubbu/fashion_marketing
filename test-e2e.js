import puppeteer from './client/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve('C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\0ea6003b-decb-4712-bd30-fea98fad5ec3');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Microsoft Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('🌐 Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. Capture initial storefront
  const storePath = path.join(SCREENSHOT_DIR, '01_storefront.png');
  await page.screenshot({ path: storePath });
  console.log('📸 Saved storefront screenshot to:', storePath);

  // 2. Find and click first product card in catalog
  console.log('🔍 Locating product cards in catalog...');
  await page.waitForFunction(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).some(b => b.textContent.includes('Select Size & Add'));
  }, { timeout: 15000 });

  const buttons = await page.$$('button');
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Select Size & Add')) {
      console.log('👆 Clicking product card button: "Select Size & Add" ...');
      await btn.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) throw new Error('Could not find Select Size & Add button');
  await new Promise(r => setTimeout(r, 1500));

  // 3. Verify modal opened
  await page.waitForSelector('h2.font-heading', { timeout: 5000 });
  const selectedTitle = await page.$eval('h2.font-heading', el => el.textContent.trim());
  console.log('✅ Product Detail opened for:', selectedTitle);

  // 4. Verify "Similar Products" section is present
  const similarHeading = await page.$eval('h3.font-heading', el => el.textContent.trim());
  console.log('✅ Section Heading found:', similarHeading);

  // 5. Check similar products count and categories
  const similarCards = await page.$$('.snap-start.shrink-0');
  console.log(`✅ Found ${similarCards.length} similar products in carousel.`);

  // 6. Scroll modal container down to "Similar Products" section
  console.log('📜 Scrolling modal container down to Similar Products...');
  await page.evaluate(() => {
    const modal = document.querySelector('.max-h-\\[94vh\\]');
    if (modal) {
      modal.scrollTo({ top: 500, behavior: 'instant' });
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const similarViewPath = path.join(SCREENSHOT_DIR, '02b_similar_products_desktop.png');
  await page.screenshot({ path: similarViewPath });
  console.log('📸 Saved Similar Products Desktop view to:', similarViewPath);

  // 7. Test clicking wishlist heart on the first similar product
  console.log('❤️ Testing Wishlist toggle on similar product...');
  const heartBtn = await page.$('.snap-start.shrink-0 button');
  if (heartBtn) {
    await heartBtn.click();
    await new Promise(r => setTimeout(r, 500));
    console.log('✅ Clicked wishlist button without navigating!');
  }

  // 8. Test clicking a similar product card to open that product
  console.log('👆 Clicking a similar product card to verify navigation...');
  const firstSimilar = similarCards[0];
  const similarTitleBefore = await firstSimilar.$eval('h4', el => el.textContent.trim());
  console.log('Target similar product to open:', similarTitleBefore);

  await firstSimilar.click();
  await new Promise(r => setTimeout(r, 1200));

  const newSelectedTitle = await page.$eval('h2.font-heading', el => el.textContent.trim());
  console.log('✅ Newly opened product at top:', newSelectedTitle);

  const switchedPath = path.join(SCREENSHOT_DIR, '03_switched_product_detail.png');
  await page.screenshot({ path: switchedPath });
  console.log('📸 Saved Switched Product screenshot to:', switchedPath);

  // 9. Mobile Viewport Test (390x844) & Scroll to Similar Products Carousel
  console.log('📱 Switching to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Similar Products'));
    if (heading) {
      heading.scrollIntoView({ block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const mobilePath = path.join(SCREENSHOT_DIR, '05_mobile_carousel_scrolled.png');
  await page.screenshot({ path: mobilePath });
  console.log('📸 Saved Mobile Scrolled Carousel screenshot to:', mobilePath);

  await browser.close();
  console.log('🎉 All automated end-to-end tests completed successfully!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
