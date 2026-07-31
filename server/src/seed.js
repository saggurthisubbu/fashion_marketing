import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Product } from './models/Product.js';

dotenv.config();

const initialProducts = [
  {
    name: "Premium Pure White Linen Shirt",
    category: "Men",
    subcategory: "Shirts",
    price: 1899,
    originalPrice: 2999,
    discount: "36% OFF",
    rating: 4.9,
    reviewsCount: 142,
    expressDelivery: "38 Mins Express",
    boutique: "MG Road Trendz, Vijayawada",
    inStock: true,
    stockQuantity: 45,
    featured: true,
    badge: "Bestseller",
    description: "Handcrafted 100% pure European linen shirt designed for ultimate breathable luxury in Vijayawada weather.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Crisp White", hex: "#FFFFFF" }, { name: "Sky Blue", hex: "#93C5FD" }],
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Royal Blue Casual Cotton Shirt",
    category: "Men",
    subcategory: "Shirts",
    price: 1299,
    originalPrice: 2199,
    discount: "40% OFF",
    rating: 4.8,
    reviewsCount: 98,
    expressDelivery: "42 Mins Express",
    boutique: "Benz Circle Menswear, Vijayawada",
    inStock: true,
    stockQuantity: 8,
    featured: true,
    badge: "Trending",
    description: "Vibrant royal blue 100% combed cotton shirt featuring a modern spread collar.",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Royal Blue", hex: "#1E3A8A" }],
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Kanchipuram Pure Silk Zari Saree",
    category: "Women",
    subcategory: "Sarees",
    price: 5499,
    originalPrice: 8999,
    discount: "39% OFF",
    rating: 4.98,
    reviewsCount: 310,
    expressDelivery: "35 Mins Express",
    boutique: "Vijayawada Silk Palace, MG Road",
    inStock: true,
    stockQuantity: 20,
    featured: true,
    badge: "Heritage Silk",
    description: "Handloomed Kanchipuram pure silk saree with heavy gold zari woven temple borders.",
    sizes: ["Free Size"],
    colors: [{ name: "Royal Magenta & Gold", hex: "#BE185D" }],
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop"
  },
  {
    name: "Boys Explorer Denim Jacket & Tee Set",
    category: "Kids",
    subcategory: "Boys Wear",
    price: 1399,
    originalPrice: 2199,
    discount: "36% OFF",
    rating: 4.9,
    reviewsCount: 84,
    expressDelivery: "38 Mins Express",
    boutique: "Vijayawada Kids World, Benz Circle",
    inStock: true,
    stockQuantity: 3,
    featured: true,
    badge: "Low Stock Pick",
    description: "3-piece set comprising stretch denim jacket, printed cotton tee, and joggers.",
    sizes: ["2-3Y", "4-5Y", "6-7Y"],
    colors: [{ name: "Denim & Red", hex: "#2563EB" }],
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1000&auto=format&fit=crop"
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
    const adminPassword = process.env.ADMIN_PASSWORD || 'QuickFitAdmin@2026!';
    
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = new User({
        name: 'QuickFit Administrator',
        email: adminEmail,
        password: adminPassword,
        phone: process.env.ADMIN_PHONE || '+91 7396629821',
        role: 'admin',
        address: { street: 'MG Road', area: 'Benz Circle', city: 'Vijayawada', pincode: '520010' }
      });
      await adminUser.save();
      console.log(`🔑 [Seeder]: Admin Created -> Email: ${adminEmail} | Password: ${adminPassword}`);
    } else {
      adminUser.name = 'QuickFit Administrator';
      adminUser.role = 'admin';
      adminUser.password = adminPassword;
      await adminUser.save();
      console.log(`🔑 [Seeder]: Admin Updated -> Email: ${adminEmail} | Password: ${adminPassword}`);
    }

    // 2. Seed Initial Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(initialProducts);
      console.log(`🛍️ [Seeder]: Inserted ${initialProducts.length} initial Vijayawada boutique products.`);
    }

    console.log('✅ [Seeder]: Database Seeding Complete.');
  } catch (error) {
    console.error(`❌ [Seeder Error]: ${error.message}`);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => mongoose.disconnect());
}

