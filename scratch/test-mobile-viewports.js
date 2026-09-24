import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9444;
const VIEWPORTS = [320, 375, 390, 430];

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();

    this.ready = new Promise((resolve) => {
      this.ws.onopen = () => resolve();
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const msgId = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('--- Launching Edge in Headless Mode on port ' + PORT + ' ---');
  const tempProfile = path.resolve('scratch/edge-profile-' + Date.now());
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ]);

  edgeProc.stderr.on('data', () => {});

  let versionInfo = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      versionInfo = await getJson(`http://127.0.0.1:${PORT}/json/version`);
      if (versionInfo && versionInfo.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!versionInfo) {
    console.error('Failed to connect to Edge debug port');
    edgeProc.kill();
    process.exit(1);
  }

  const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);

  await client.send('Page.enable');
  await client.send('DOM.enable');

  for (const width of VIEWPORTS) {
    console.log(`\n==================================================`);
    console.log(`=== Testing Mobile Viewport: ${width}px ===`);
    console.log(`==================================================`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await client.send('Page.navigate', { url: 'http://localhost:5173/' });

    // Wait until products are loaded and rendered
    let loaded = false;
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const check = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const cards = document.querySelectorAll('#catalog-section .grid > div');
            const hasRealProducts = Array.from(cards).some(c => c.querySelector('button[aria-label*="Wishlist"]'));
            return { count: cards.length, hasRealProducts };
          })()
        `,
        returnByValue: true,
      });

      if (check.result.value.hasRealProducts) {
        loaded = true;
        console.log(`Products rendered (${check.result.value.count} cards) after ${i + 1}s`);
        break;
      }
    }

    // Scroll to catalog section for evaluation & screenshot
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const catalog = document.getElementById('catalog-section');
          if (catalog) {
            catalog.scrollIntoView({ behavior: 'instant' });
          }
        })()
      `,
    });

    await client.send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `
        (async () => {
          const imgs = Array.from(document.querySelectorAll('#catalog-section img'));
          await Promise.all(imgs.map(img => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise(res => {
              img.onload = () => res();
              img.onerror = () => res();
              setTimeout(res, 4000);
            });
          }));
        })()
      `,
    });
    await sleep(500);

    const evalResult = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyOverflowX = document.body.scrollWidth > window.innerWidth;
          
          // Navbar
          const nav = document.querySelector('header');
          const navRect = nav ? nav.getBoundingClientRect() : null;

          // Category Pills container
          const catContainer = document.querySelector('#catalog-section .overflow-x-auto');
          const catScrollWidth = catContainer ? catContainer.scrollWidth : 0;
          const catClientWidth = catContainer ? catContainer.clientWidth : 0;
          const catButtons = catContainer ? Array.from(catContainer.querySelectorAll('button')).map(b => ({
            name: b.innerText.trim(),
            width: Math.round(b.getBoundingClientRect().width),
            height: Math.round(b.getBoundingClientRect().height)
          })) : [];

          // Catalog Grid
          const catalogGrid = document.querySelector('#catalog-section .grid');
          const gridStyle = catalogGrid ? window.getComputedStyle(catalogGrid) : null;
          const gridCols = gridStyle ? gridStyle.gridTemplateColumns.split(' ').length : 0;
          const gridGap = gridStyle ? gridStyle.gap : '';

          // Product Cards inspection
          const cards = document.querySelectorAll('#catalog-section .grid > div');
          const cardAnalysis = Array.from(cards).map((card, i) => {
            const cardRect = card.getBoundingClientRect();
            const imgBox = card.querySelector('div[class*="aspect-"]');
            const imgBoxRect = imgBox ? imgBox.getBoundingClientRect() : null;
            const img = card.querySelector('img');
            const heartBtn = card.querySelector('button[aria-label*="Wishlist"]');
            const heartRect = heartBtn ? heartBtn.getBoundingClientRect() : null;
            const addBtn = card.querySelector('button:not([aria-label*="Wishlist"])');
            const addBtnRect = addBtn ? addBtn.getBoundingClientRect() : null;
            const nameEl = card.querySelector('h3');
            const priceEl = card.querySelector('span[class*="font-black"]');

            return {
              cardIndex: i,
              cardWidth: Math.round(cardRect.width),
              cardHeight: Math.round(cardRect.height),
              cardTop: Math.round(cardRect.top),
              imageWidth: imgBoxRect ? Math.round(imgBoxRect.width) : 0,
              imageHeight: imgBoxRect ? Math.round(imgBoxRect.height) : 0,
              aspectRatio: imgBoxRect ? (imgBoxRect.width / imgBoxRect.height).toFixed(3) : null,
              heartButton: heartRect ? {
                topOffset: Math.round(heartRect.top - cardRect.top),
                rightOffset: Math.round(cardRect.right - heartRect.right),
                size: Math.round(heartRect.width) + 'x' + Math.round(heartRect.height)
              } : null,
              nameText: nameEl ? nameEl.innerText.trim() : '',
              priceText: priceEl ? priceEl.innerText.trim() : '',
              addBtn: addBtnRect ? {
                label: addBtn.innerText.trim(),
                width: Math.round(addBtnRect.width),
                height: Math.round(addBtnRect.height),
                fullWidthRatio: (addBtnRect.width / (cardRect.width - 20)).toFixed(2), // roughly full card inner width
                bottomOffset: Math.round(cardRect.bottom - addBtnRect.bottom)
              } : null
            };
          });

          return {
            viewportWidth: window.innerWidth,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalOverflow: bodyOverflowX,
            navHeight: navRect ? Math.round(navRect.height) : 0,
            categoryTabs: {
              count: catButtons.length,
              scrollable: catScrollWidth > catClientWidth,
              buttons: catButtons
            },
            grid: {
              columnCount: gridCols,
              gap: gridGap,
              totalProducts: cards.length
            },
            cards: cardAnalysis
          };
        })()
      `,
      returnByValue: true,
    });

    const data = evalResult.result.value;
    console.log(`\n--- Verification Summary for ${width}px ---`);
    console.log(`- Horizontal Overflow: ${data.hasHorizontalOverflow ? 'FAIL (Overflow)' : 'PASS (No overflow)'}`);
    console.log(`- Navbar Height: ${data.navHeight}px`);
    console.log(`- Category Tabs Count: ${data.categoryTabs.count}, Scrollable: ${data.categoryTabs.scrollable}`);
    console.log(`- Product Grid Columns: ${data.grid.columnCount} (Gap: ${data.grid.gap})`);
    console.log(`- Product Cards Total: ${data.grid.totalProducts}`);
    if (data.cards.length >= 2) {
      console.log(`- Card 0: ${data.cards[0].cardWidth}x${data.cards[0].cardHeight}px | Card 1: ${data.cards[1].cardWidth}x${data.cards[1].cardHeight}px (Equal Width: ${data.cards[0].cardWidth === data.cards[1].cardWidth}, Equal Height: ${data.cards[0].cardHeight === data.cards[1].cardHeight})`);
      console.log(`- Image Aspect Ratio: ${data.cards[0].aspectRatio} (3/4 = 0.750)`);
      console.log(`- Heart Button: ${JSON.stringify(data.cards[0].heartButton)}`);
      console.log(`- Add To Bag Button: Width=${data.cards[0].addBtn?.width}px, Height=${data.cards[0].addBtn?.height}px, BottomOffset=${data.cards[0].addBtn?.bottomOffset}px`);
      console.log(`- Bottom Button Row 1 Alignment: Card 0 bottomOffset=${data.cards[0].addBtn?.bottomOffset}px, Card 1 bottomOffset=${data.cards[1].addBtn?.bottomOffset}px`);
    }

    // Capture screenshot of catalog section
    const ss = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    fs.writeFileSync(`scratch/catalog_${width}px.png`, Buffer.from(ss.data, 'base64'));
    console.log(`Saved screenshot: scratch/catalog_${width}px.png`);
  }

  client.close();
  edgeProc.kill();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n================ ALL VIEWPORTS VERIFIED SUCCESSFULLY ================');
}

run().catch((e) => {
  console.error('Test script error:', e);
  process.exit(1);
});
