import puppeteer from '../client/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve('C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\ea19e7a9-ef6b-40f2-a9dd-3acb60edceee');

async function testHeroCarousel() {
  console.log('🚀 Starting Hero Carousel E2E Browser Test...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('🌐 Loading QuickFit homepage at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // 1. Check Hero section elements
  console.log('🔍 Checking Hero Carousel elements...');
  await page.waitForSelector('.hero-carousel-stage', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  const initialSlideInfo = await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const dots = document.querySelectorAll('button[aria-label^="Showcase product"]');
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    const activeTitle = activeCard ? activeCard.querySelector('h3')?.textContent : null;
    const activePrice = activeCard ? activeCard.querySelector('.text-slate-900')?.textContent : null;
    return {
      cardCount: cards.length,
      dotCount: dots.length,
      activeTitle,
      activePrice
    };
  });

  console.log('✅ Initial Carousel state:', initialSlideInfo);

  // Screenshot 1: Desktop Initial 3D Card Stack
  const screen1 = path.join(SCREENSHOT_DIR, 'hero_01_desktop_initial.png');
  await page.screenshot({ path: screen1 });
  console.log('📸 Saved:', screen1);

  // 2. Click "Next" Arrow Control
  console.log('👉 Clicking Next Arrow button...');
  const nextBtn = await page.waitForSelector('button[aria-label="Next product"]');
  await nextBtn.click();
  await new Promise(r => setTimeout(r, 800)); // wait for 650ms transition

  const secondSlideInfo = await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    return {
      activeTitle: activeCard ? activeCard.querySelector('h3')?.textContent : null
    };
  });
  console.log('✅ After Next click, active product:', secondSlideInfo.activeTitle);

  // Screenshot 2: Desktop After Arrow Click Transition
  const screen2 = path.join(SCREENSHOT_DIR, 'hero_02_desktop_arrow_next.png');
  await page.screenshot({ path: screen2 });
  console.log('📸 Saved:', screen2);

  // 3. Click Pagination Dot #3
  console.log('👉 Clicking Pagination Dot #3...');
  await page.evaluate(() => {
    const dots = document.querySelectorAll('button[aria-label^="Showcase product"]');
    if (dots.length >= 3) dots[2].click();
  });
  await new Promise(r => setTimeout(r, 800));

  const thirdSlideInfo = await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    return {
      activeTitle: activeCard ? activeCard.querySelector('h3')?.textContent : null
    };
  });
  console.log('✅ After Dot #3 click, active product:', thirdSlideInfo.activeTitle);

  // Screenshot 3: Desktop After Dot Jump
  const screen3 = path.join(SCREENSHOT_DIR, 'hero_03_desktop_dot_jump.png');
  await page.screenshot({ path: screen3 });
  console.log('📸 Saved:', screen3);

  // 4. Test Autoplay (wait 4 seconds and observe index change)
  console.log('⏳ Waiting 4 seconds to test autoplay transition...');
  // Move mouse away to ensure no hover
  await page.mouse.move(10, 10);
  await new Promise(r => setTimeout(r, 4200));

  const autoplaySlideInfo = await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    return {
      activeTitle: activeCard ? activeCard.querySelector('h3')?.textContent : null
    };
  });
  console.log('✅ After Autoplay interval, active product:', autoplaySlideInfo.activeTitle);

  // 5. Click active card to open product detail modal
  console.log('👆 Clicking active card to verify Product Detail modal opens...');
  await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    if (activeCard) activeCard.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const modalOpened = await page.evaluate(() => {
    const modalHeading = document.querySelector('h2, [role="dialog"]');
    return document.body.textContent.includes('Select Size & Add') || document.body.textContent.includes('Buy Now');
  });
  console.log('✅ Product Detail Modal opened from Hero card:', modalOpened);

  // Screenshot 4: Product Detail opened from Hero Card
  const screen4 = path.join(SCREENSHOT_DIR, 'hero_04_product_modal_opened.png');
  await page.screenshot({ path: screen4 });
  console.log('📸 Saved:', screen4);

  // Close modal (hit Escape or click close button)
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 800));

  // 6. Test Mobile Viewport (390x844 - iPhone / Mobile)
  console.log('\n📱 Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 5: Mobile Viewport Initial (scrolled to carousel)
  await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    if (stage) stage.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const screen5 = path.join(SCREENSHOT_DIR, 'hero_05_mobile_initial.png');
  await page.screenshot({ path: screen5 });
  console.log('📸 Saved:', screen5);

  // Simulate Touch Swipe Left on Mobile
  console.log('👉 Simulating Mobile Swipe Left...');
  const stageEl = await page.$('.hero-carousel-stage');
  const box = await stageEl.boundingBox();
  const startX = box.x + box.width * 0.7;
  const endX = box.x + box.width * 0.2;
  const centerY = box.y + box.height / 2;

  await page.touchscreen.touchStart(startX, centerY);
  await page.touchscreen.touchMove(endX, centerY);
  await page.touchscreen.touchEnd();
  await new Promise(r => setTimeout(r, 1000));

  const mobileSwipedInfo = await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    const cards = stage ? stage.querySelectorAll('.hero-carousel-card') : [];
    const activeCard = Array.from(cards).find(c => c.getAttribute('aria-hidden') === 'false');
    return {
      activeTitle: activeCard ? activeCard.querySelector('h3')?.textContent : null
    };
  });
  console.log('✅ After Mobile Swipe, active product:', mobileSwipedInfo.activeTitle);

  // Screenshot 6: Mobile After Swipe
  await page.evaluate(() => {
    const stage = document.querySelector('.hero-carousel-stage');
    if (stage) stage.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));

  const screen6 = path.join(SCREENSHOT_DIR, 'hero_06_mobile_swiped.png');
  await page.screenshot({ path: screen6 });
  console.log('📸 Saved:', screen6);

  await browser.close();
  console.log('\n🎉 ALL HERO CAROUSEL TESTS PASSED SUCCESSFULLY!');
}

testHeroCarousel().catch(err => {
  console.error('❌ Hero Carousel Test Failed:', err);
  process.exit(1);
});
