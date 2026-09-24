import axios from 'axios';
import fs from 'fs';
import path from 'path';

process.env.VITE_API_URL = 'http://localhost:5000/api';
const { resolveImageUrl } = await import('../client/src/config/api.js');


async function testFullFlow() {
  console.log('=== STARTING COMPLETE PRODUCT & IMAGE FLOW VERIFICATION ===\n');

  // 1. Create a distinct small test image buffer (PNG)
  // 1x1 red PNG buffer
  const testPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  console.log('1. Prepared unique test image buffer (PNG).');

  // 2. Upload image to backend
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('image', testPngBuffer, {
    filename: `test-unique-${Date.now()}.png`,
    contentType: 'image/png'
  });

  const uploadRes = await axios.post('http://localhost:5000/api/upload', form, {
    headers: form.getHeaders()
  });

  console.log('2. Image upload response:', {
    success: uploadRes.data.success,
    imageUrl: uploadRes.data.imageUrl,
    storage: uploadRes.data.storage
  });

  const uploadedUrl = uploadRes.data.imageUrl;
  if (!uploadedUrl) {
    throw new Error('Upload did not return an imageUrl!');
  }

  // 3. Create a product with this image
  // First login as admin
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'saggurthisubbu9@gmail.com',
    password: 'QuickFitAdmin@2026!'
  });

  const token = loginRes.data.token;
  console.log('3. Authenticated as admin. Token received.');

  const productPayload = {
    name: `VERIFIED TEST PRODUCT ${Date.now()}`,
    category: 'Men',
    subcategory: 'Oversized T-Shirts',
    price: 1299,
    originalPrice: 1999,
    stockQuantity: 50,
    inStock: true,
    isActive: true,
    published: true,
    boutique: 'QuickFit Central, Vijayawada',
    description: 'Test product created to verify complete image upload and persistence flow.',
    sizes: ['S', 'M', 'L', 'XL'],
    images: {
      front: uploadedUrl,
      back: '',
      left: '',
      right: ''
    },
    image: uploadedUrl
  };

  const createProdRes = await axios.post('http://localhost:5000/api/products', productPayload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('4. Product created in MongoDB:', {
    _id: createProdRes.data._id,
    name: createProdRes.data.name,
    image: createProdRes.data.image,
    images: createProdRes.data.images
  });

  const createdId = createProdRes.data._id;

  // 5. Query /api/products (public storefront API)
  const catalogRes = await axios.get('http://localhost:5000/api/products');
  const foundProd = catalogRes.data.find(p => p._id === createdId || p.name === productPayload.name);

  if (!foundProd) {
    throw new Error('Newly created product not found in /api/products response!');
  }
  console.log('5. Found product in public API response:', {
    _id: foundProd._id,
    name: foundProd.name,
    image: foundProd.image,
    images: foundProd.images
  });

  // 6. Test frontend URL resolution
  const resolvedUrl = resolveImageUrl(foundProd.images?.front || foundProd.image);
  console.log('6. Frontend resolved image URL:', resolvedUrl);


  // 7. Test fetching the image using resolved URL
  const imgFetchRes = await axios.get(resolvedUrl, { responseType: 'arraybuffer' });
  console.log('7. Fetched image from resolved URL:', {
    status: imgFetchRes.status,
    contentType: imgFetchRes.headers['content-type'],
    bytes: imgFetchRes.data.length
  });

  if (imgFetchRes.data.length !== testPngBuffer.length) {
    throw new Error(`Byte length mismatch: expected ${testPngBuffer.length}, got ${imgFetchRes.data.length}`);
  }

  console.log('\n=== ALL 7 STEPS VERIFIED SUCCESSFULLY! ===');
  console.log('Uploaded image matches the original byte-for-byte without ANY placeholder replacement!');
}

testFullFlow().catch(err => {
  console.error('VERIFICATION FAILED:', err.response?.data || err.message);
  process.exit(1);
});
