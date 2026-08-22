import axios from 'axios';

async function test() {
  const localUrl = 'http://localhost:5000/uploads/quickfit-shirts-product-1-f-1787389109323-791186258.jpg';
  const renderUrl = 'https://quickfit-backend-m1yl.onrender.com/uploads/quickfit-shirts-product-1-f-1787389109323-791186258.jpg';

  try {
    const resLocal = await axios.head(localUrl);
    console.log('Local uploads status:', resLocal.status);
  } catch (e) {
    console.log('Local uploads error:', e.message);
  }

  try {
    const resRender = await axios.head(renderUrl);
    console.log('Render uploads status:', resRender.status);
  } catch (e) {
    console.log('Render uploads error:', e.message);
  }
}

test();
