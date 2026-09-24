import { resolveImageUrl } from '../client/src/config/api.js';

async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const products = await res.json();
    console.log('Total products from API:', products.length);
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      console.log(`Product #${i + 1}: ${p.name}`);
      console.log('  DB image:', p.image);
      console.log('  DB images.front:', p.images?.front);
      const resolved = resolveImageUrl(p.images?.front || p.image);
      console.log('  Resolved image URL:', resolved);
      
      // Test fetching this resolved URL
      try {
        const imgRes = await fetch(resolved);
        console.log(`  Fetch test: ${imgRes.status} ${imgRes.statusText} (${imgRes.headers.get('content-type')})`);
      } catch (err) {
        console.log(`  Fetch test FAILED: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
