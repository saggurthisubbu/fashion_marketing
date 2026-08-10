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

import { DeliveryPartner } from './models/DeliveryPartner.js';
import { Category } from './models/Category.js';
import { Setting } from './models/Setting.js';
import { Notification } from './models/Notification.js';

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickfit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('[MONGODB] Seeder connected to database.');

    // 1. Seed/Update Default Admin User (Admin ID: admin, Password: admin123)
    const defaultAdminEmail = 'admin@quickfit.com';
    let admin = await User.findOne({ $or: [{ adminId: 'admin' }, { email: defaultAdminEmail }, { email: 'saggurthisubbu9@gmail.com' }] });
    
    if (!admin) {
      admin = new User({
        name: 'QuickFit Administrator',
        email: defaultAdminEmail,
        adminId: 'admin',
        password: 'admin123',
        phone: '+91 7396629821',
        role: 'admin',
        address: {
          street: 'Central Mall Boulevard',
          area: 'Benz Circle, Vijayawada',
          city: 'Vijayawada'
        }
      });
      await admin.save();
      console.log('🔑 [Seeder]: Default Admin Created -> Admin ID: admin | Password: admin123');
    } else {
      admin.adminId = 'admin';
      admin.role = 'admin';
      admin.password = 'admin123';
      await admin.save();
      console.log('🔑 [Seeder]: Admin Verified & Updated -> Admin ID: admin | Password: admin123');
    }

    // 2. Safe product seeding: ONLY seed defaults if the database has ZERO products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(initialProducts);
      console.log(`🛍️ [Seeder]: Database was empty. Initialized with ${initialProducts.length} starter products.`);
    } else {
      console.log(`🛍️ [Seeder]: Preserved ${productCount} existing products in database.`);
    }

    // 3. Seed Delivery Partners if empty
    const partnerCount = await DeliveryPartner.countDocuments();
    if (partnerCount === 0) {
      await DeliveryPartner.insertMany([
        {
          name: 'Ravi Kumar (Quick Rider #1)',
          phone: '+91 9848012345',
          email: 'ravi.rider@quickfit.com',
          vehicleNumber: 'AP 16 AB 1234',
          vehicleType: 'Electric Bike',
          status: 'Available',
          zone: 'Benz Circle & MG Road',
          activeOrdersCount: 0,
          completedDeliveries: 142,
          rating: 4.95
        },
        {
          name: 'Suresh Varma (Express Rider #2)',
          phone: '+91 9848056789',
          email: 'suresh.rider@quickfit.com',
          vehicleNumber: 'AP 16 CD 5678',
          vehicleType: 'Bike',
          status: 'On Delivery',
          zone: 'Governorpet & Eluru Road',
          activeOrdersCount: 1,
          completedDeliveries: 98,
          rating: 4.88
        },
        {
          name: 'Sai Teja (Hyperlocal Rider #3)',
          phone: '+91 9848099887',
          email: 'saiteja.rider@quickfit.com',
          vehicleNumber: 'AP 16 EF 9012',
          vehicleType: 'Scooter',
          status: 'Available',
          zone: 'Labbipet & Bandal Road',
          activeOrdersCount: 0,
          completedDeliveries: 76,
          rating: 4.92
        }
      ]);
      console.log('🚚 [Seeder]: Initialized 3 QuickFit Delivery Partners.');
    }

    // 4. Seed Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany([
        {
          name: 'Oversized T-Shirts',
          slug: 'oversized-t-shirts',
          description: '240+ GSM ultra-heavy boxy streetwear fits with drop seams.',
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
          subcategories: ['Heavyweight Boxy', 'Acid Wash', 'Raw Cotton'],
          itemCount: 2,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Drop Shoulder T-Shirts',
          slug: 'drop-shoulder-t-shirts',
          description: 'Relaxed modern drape engineered for European streetwear silhouettes.',
          image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
          subcategories: ['Minimalist Monochrome', 'Signature Drop', 'Chalk Series'],
          itemCount: 2,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Polo T-Shirts',
          slug: 'polo-t-shirts',
          description: 'Double mercerized Supima cotton pique luxury collars.',
          image: 'https://images.unsplash.com/photo-1625910513413-5b8d2b96dc36?q=80&w=1000&auto=format&fit=crop',
          subcategories: ['Luxury Pique', 'Textured Knit', 'Matte Finish'],
          itemCount: 2,
          isActive: true,
          sortOrder: 3
        },
        {
          name: 'Linen Shirts',
          slug: 'linen-shirts',
          description: '100% pure European breezy linen for ultimate breathable luxury.',
          image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop',
          subcategories: ['Pure White Classic', 'Sky Linen', 'Resort Collar'],
          itemCount: 1,
          isActive: true,
          sortOrder: 4
        }
      ]);
      console.log('🏷️ [Seeder]: Initialized 4 Master Apparel Categories.');
    }

    // 5. Seed Store Settings if empty
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      await Setting.create({
        storeName: 'QuickFit Menswear Vijayawada',
        contactEmail: 'admin@quickfit.com',
        supportPhone: '+91 7396629821',
        storeAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
        currency: 'INR',
        currencySymbol: '₹',
        deliveryFee: 49,
        freeDeliveryThreshold: 999,
        lowStockThreshold: 10,
        taxPercent: 5,
        expressDeliveryTime: '45-60 Mins',
        liveTrackingEnabled: true
      });
      console.log('⚙️ [Seeder]: Initialized Default Store Settings.');
    }

    // 6. Seed Sample Notifications if empty
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      await Notification.insertMany([
        {
          title: 'System Initialized',
          message: 'QuickFit Admin Portal is fully connected and ready for express operations.',
          type: 'system',
          priority: 'low',
          isRead: false
        },
        {
          title: 'Inventory Alert',
          message: 'Monochrome Chalk White Drop Shoulder Tee is running low (20 items left).',
          type: 'inventory',
          priority: 'medium',
          isRead: false
        }
      ]);
      console.log('🔔 [Seeder]: Initialized Starter Notifications.');
    }

    console.log('✅ [Seeder]: All Collections Verified & Initialized.');
  } catch (error) {
    console.error('❌ [Seeder Error]:', error.message);
  }
};
