import axios from 'axios';

async function test() {
  const viteUrl = 'http://localhost:5173/uploads/quickfit-shirts-product-1-f-1787389109323-791186258.jpg';
  try {
    const res = await axios.head(viteUrl);
    console.log('Vite dev server uploads status:', res.status, res.headers['content-type']);
  } catch (e) {
    console.log('Vite dev server uploads error:', e.message);
  }
}

test();
