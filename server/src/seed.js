import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Product } from './models/Product.js';

dotenv.config();

const initialProducts = [
  {
    name: "Monochrome Heavyweight Oversized Tee - Pitch Black",
    category: "Men",
    subcategory: "Oversized T-Shirts",
    price: 1499,
    originalPrice: 2499,
    discount: "40% OFF",
    rating: 4.95,
    reviewsCount: 184,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 45,
    featured: true,
    badge: "Bestseller",
    description: "260 GSM ultra-heavy French Terry luxury cotton oversized tee. Boxy relaxed silhouette with reinforced ribbed collar.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Pitch Black", hex: "#000000" }, { name: "Charcoal Grey", hex: "#1F2937" }],
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Raw Off-White Boxy Oversized T-Shirt",
    category: "Men",
    subcategory: "Oversized T-Shirts",
    price: 1399,
    originalPrice: 2199,
    discount: "36% OFF",
    rating: 4.9,
    reviewsCount: 92,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 30,
    featured: true,
    badge: "Trending",
    description: "Minimalist unbleached raw organic cotton oversized tee. Clean monochrome drape tailored for modern streetwear fits.",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Off White", hex: "#F5F5F5" }, { name: "Pure White", hex: "#FFFFFF" }],
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Signature Drop Shoulder Relaxed Tee - Slate Black",
    category: "Men",
    subcategory: "Drop Shoulder T-Shirts",
    price: 1299,
    originalPrice: 1999,
    discount: "35% OFF",
    rating: 4.88,
    reviewsCount: 114,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 35,
    featured: true,
    badge: "Trending",
    description: "Engineered dropped shoulder seam with wider sleeve circumference. Premium combed 100% bio-washed cotton.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Slate Black", hex: "#0F172A" }, { name: "Off White", hex: "#F5F5F5" }],
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Monochrome Chalk White Drop Shoulder Tee",
    category: "Men",
    subcategory: "Drop Shoulder T-Shirts",
    price: 1199,
    originalPrice: 1899,
    discount: "37% OFF",
    rating: 4.85,
    reviewsCount: 76,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 20,
    featured: false,
    badge: "Modern Fit",
    description: "Clean aesthetic pure white drop shoulder tee with reinforced double needle hem. Breathable lightweight luxury.",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Chalk White", hex: "#FFFFFF" }],
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Luxury Mercerized Cotton Polo - Jet Black",
    category: "Men",
    subcategory: "Polo T-Shirts",
    price: 1799,
    originalPrice: 2899,
    discount: "38% OFF",
    rating: 4.96,
    reviewsCount: 148,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 25,
    featured: true,
    badge: "Luxury Pique",
    description: "Double mercerized 100% Supima cotton polo with crisp structured collar and matte black buttons.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Jet Black", hex: "#000000" }, { name: "Crisp White", hex: "#FFFFFF" }],
    image: "https://images.unsplash.com/photo-1625910513413-5b8d2b96dc36?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1625910513413-5b8d2b96dc36?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Minimalist Knit Texture Polo - Off-White",
    category: "Men",
    subcategory: "Polo T-Shirts",
    price: 1899,
    originalPrice: 2999,
    discount: "37% OFF",
    rating: 4.9,
    reviewsCount: 82,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 18,
    featured: true,
    badge: "New Arrival",
    description: "Open-knit textured breathable pique polo designed for clean minimalist European streetwear styling.",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Off White", hex: "#F5F5F5" }],
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1625910513413-5b8d2b96dc36?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop"
    }
  },
  {
    name: "Premium Pure White Linen Shirt",
    category: "Men",
    subcategory: "Shirts",
    price: 1899,
    originalPrice: 2999,
    discount: "36% OFF",
    rating: 4.9,
    reviewsCount: 142,
    expressDelivery: "Express Dispatch",
    boutique: "QuickFit Central, Vijayawada",
    inStock: true,
    stockQuantity: 45,
    featured: true,
    badge: "Bestseller",
    description: "Handcrafted 100% pure European linen shirt designed for ultimate breathable luxury in Vijayawada weather.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Crisp White", hex: "#FFFFFF" }, { name: "Sky Blue", hex: "#93C5FD" }],
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop",
    images: {
      front: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop",
      back: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop",
      left: "https://images.unsplash.com/photo-1625910513413-5b8d2b96dc36?q=80&w=1000&auto=format&fit=crop",
      right: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=1000&auto=format&fit=crop"
    }
  }
];

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickfit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('[Seeder]: Connected to MongoDB');

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'saggurthisubbu9@gmail.com';
    const adminPhone = process.env.ADMIN_PHONE || '+91 7396629821';
    const adminPassword = process.env.ADMIN_PASSWORD || 'QuickFitAdmin@2026!';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'QuickFit Administrator',
        email: adminEmail,
        password: adminPassword,
        phone: adminPhone,
        role: 'admin',
        address: {
          street: 'Central Mall Boulevard',
          area: 'Benz Circle, Vijayawada'
        }
      });
      await admin.save();
      console.log(`🔑 [Seeder]: Admin Created -> Email: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      console.log(`🔑 [Seeder]: Admin Updated -> Email: ${adminEmail}`);
    }

    // 2. Re-seed with 4-view images
    await Product.deleteMany({});
    await Product.insertMany(initialProducts);
    console.log(`🛍️ [Seeder]: Seeded ${initialProducts.length} Men's products with full 4-angle views.`);

    console.log('✅ [Seeder]: Database Seeding Complete.');
  } catch (error) {
    console.error('❌ [Seeder Error]:', error.message);
  }
};
