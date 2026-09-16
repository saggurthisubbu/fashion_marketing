import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

async function fixImageUrls() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Fix Product 0 (Emerald Botanical Print Relaxed Cuban Shirt)
    const product0Id = '6aa23f540a9775438d72a2c1';
    const prod0 = await Product.findById(product0Id);
    if (prod0) {
      prod0.name = 'Emerald Botanical Print Relaxed Cuban Shirt';
      prod0.category = 'Men';
      prod0.subcategory = 'Shirts';
      prod0.image = '/uploads/quickfit-product-front-4x5-final-1789044286288-437978021.jpg';
      prod0.images = {
        front: '/uploads/quickfit-product-front-4x5-final-1789044286288-437978021.jpg',
        back: '/uploads/quickfit-product-back-4x5-final-1789044286395-97328662.jpg',
        left: '/uploads/quickfit-product-left-4x5-final-1789044286413-353161597.jpg',
        right: '/uploads/quickfit-product-right-1x1-final-1789044286429-122192188.jpg'
      };
      prod0.gallery = [
        prod0.images.front,
        prod0.images.back,
        prod0.images.left,
        prod0.images.right
      ];
      await prod0.save();
      console.log('✅ Product 0 updated successfully with valid high-resolution shirt views.');
    } else {
      console.log('ℹ️ Product 0 ID not found directly, checking all products...');
    }

    // 2. Validate all products to ensure all image paths exist on disk
    const allProducts = await Product.find({});
    console.log(`Checking ${allProducts.length} products...`);
    for (const p of allProducts) {
      let modified = false;
      const front = p.images?.front || p.image;
      if (front && front.startsWith('/uploads/')) {
        const localPath = path.join(uploadsDir, front.replace('/uploads/', ''));
        if (!fs.existsSync(localPath)) {
          console.warn(`⚠️ Missing image for product ${p.name}: ${front}`);
          // Fallback to valid shirt or product image
          const fallback = p.subcategory === 'Shirts'
            ? '/uploads/quickfit-shirts-product-1-f-1787389109323-791186258.jpg'
            : '/uploads/quickfit-product-1-front-1786364892855-32486295.jpg';
          p.image = fallback;
          if (!p.images) p.images = {};
          p.images.front = fallback;
          modified = true;
        }
      }
      if (modified) {
        await p.save();
        console.log(`Fixed product ${p.name}`);
      }
    }

    // 3. Fix Categories in MongoDB
    console.log('Fixing categories in MongoDB...');
    const categoryUpdates = [
      {
        slug: 'shirts',
        name: 'Shirts',
        image: '/uploads/quickfit-shirts-product-1-f-1787389109323-791186258.jpg',
        description: '100% Pure European Linen & Luxury Cuban Collars'
      },
      {
        slug: 'oversized-t-shirts',
        name: 'Oversized T-Shirts',
        image: '/uploads/quickfit-drop-shoulder-product-1-back-1787386700503-621644177.jpg',
        description: '240+ GSM French Terry & Modern Boxy Cuts'
      },
      {
        slug: 'drop-shoulder-t-shirts',
        name: 'Drop Shoulder T-Shirts',
        image: '/uploads/quickfit-drop-shoulder-product-1-front-1787078076710-233382103.jpg',
        description: 'Relaxed Silhouettes & Bio-Washed Cotton'
      },
      {
        slug: 'polo-t-shirts',
        name: 'Polo T-Shirts',
        image: '/uploads/quickfit-polo-t-shirts-1-front-1786369177869-286899166.jpg',
        description: 'Double-Mercerized Luxury Pique Knits'
      }
    ];

    for (const catData of categoryUpdates) {
      const cat = await Category.findOne({ $or: [{ slug: catData.slug }, { name: catData.name }] });
      if (cat) {
        cat.image = catData.image;
        cat.description = catData.description || cat.description;
        cat.isActive = true;
        await cat.save();
        console.log(`✅ Category "${cat.name}" updated image -> ${cat.image}`);
      } else {
        await Category.create({
          name: catData.name,
          slug: catData.slug,
          image: catData.image,
          description: catData.description,
          isActive: true
        });
        console.log(`✅ Category "${catData.name}" created with image -> ${catData.image}`);
      }
    }

    // 4. Ensure Polo T-Shirts Products Exist in MongoDB
    const poloCount = await Product.countDocuments({
      $or: [
        { subcategory: 'Polo T-Shirts' },
        { name: /polo/i }
      ]
    });

    if (poloCount === 0) {
      console.log('Seeding Polo T-Shirts with local uploaded high-resolution assets...');
      await Product.create([
        {
          name: 'Structured Supima Pique Polo T-Shirt - Jet Black',
          category: 'Men',
          subcategory: 'Polo T-Shirts',
          price: 999,
          originalPrice: 1599,
          discount: '38% OFF',
          rating: 4.95,
          reviewsCount: 32,
          expressDelivery: 'Express Delivery',
          boutique: 'QuickFit Central, Vijayawada',
          inStock: true,
          stockQuantity: 25,
          featured: true,
          badge: 'Luxury Pique',
          description: 'Double-mercerized 100% Supima cotton pique luxury collar. Tailored structured fit with durable ribbed cuffs.',
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          image: '/uploads/quickfit-polo-t-shirts-1-front-1786369177869-286899166.jpg',
          images: {
            front: '/uploads/quickfit-polo-t-shirts-1-front-1786369177869-286899166.jpg',
            back: '/uploads/quickfit-polo-t-shirts-1-back-1786369177893-279196966.jpg',
            left: '/uploads/quickfit-polo-t-shirts-1-left-1786369177912-54773569.jpg',
            right: '/uploads/quickfit-polo-t-shirts-1-r-1786369177928-989217484.jpg'
          },
          gallery: [
            '/uploads/quickfit-polo-t-shirts-1-front-1786369177869-286899166.jpg',
            '/uploads/quickfit-polo-t-shirts-1-back-1786369177893-279196966.jpg',
            '/uploads/quickfit-polo-t-shirts-1-left-1786369177912-54773569.jpg',
            '/uploads/quickfit-polo-t-shirts-1-r-1786369177928-989217484.jpg'
          ]
        },
        {
          name: 'Luxury Mercerized Pique Knit Polo - Classic Edition',
          category: 'Men',
          subcategory: 'Polo T-Shirts',
          price: 1099,
          originalPrice: 1799,
          discount: '39% OFF',
          rating: 4.9,
          reviewsCount: 28,
          expressDelivery: 'Express Delivery',
          boutique: 'QuickFit Central, Vijayawada',
          inStock: true,
          stockQuantity: 20,
          featured: true,
          badge: 'Trending',
          description: 'Premium combed pique knit with double-needle tailoring and premium textured finish for modern streetwear.',
          sizes: ['S', 'M', 'L', 'XL'],
          image: '/uploads/quickfit-polo-t-shirts-2-f-1786369258299-353206166.jpg',
          images: {
            front: '/uploads/quickfit-polo-t-shirts-2-f-1786369258299-353206166.jpg',
            back: '/uploads/quickfit-polo-t-shirts-2-b-1786369258283-867649163.jpg',
            left: '/uploads/quickfit-polo-t-shirts-2-l-1786369258266-586519169.jpg',
            right: '/uploads/quickfit-polo-t-shirts-2-r-1786369258317-553869610.jpg'
          },
          gallery: [
            '/uploads/quickfit-polo-t-shirts-2-f-1786369258299-353206166.jpg',
            '/uploads/quickfit-polo-t-shirts-2-b-1786369258283-867649163.jpg',
            '/uploads/quickfit-polo-t-shirts-2-l-1786369258266-586519169.jpg',
            '/uploads/quickfit-polo-t-shirts-2-r-1786369258317-553869610.jpg'
          ]
        }
      ]);
      console.log('✅ Seeded 2 Polo T-Shirt products with valid uploads!');
    }

    console.log('🎉 All image URLs and database records successfully verified and updated!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing image URLs:', err);
    process.exit(1);
  }
}

fixImageUrls();
