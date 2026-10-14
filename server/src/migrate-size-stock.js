import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Use resilient DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB Atlas.');

    const col = mongoose.connection.db.collection('products');
    const products = await col.find({}).toArray();
    console.log(`📦 Found ${products.length} products total.`);

    let updatedCount = 0;
    const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    for (const prod of products) {
      const existingStock = prod.stockQuantity !== undefined && !isNaN(Number(prod.stockQuantity))
        ? Math.max(0, Number(prod.stockQuantity))
        : 25;

      // Check if sizeStock already exists and is valid
      const hasValidSizeStock = prod.sizeStock && typeof prod.sizeStock === 'object' && Object.keys(prod.sizeStock).length > 0;

      if (!hasValidSizeStock) {
        // Distribute existing stock across S, M, L, XL, XXL safely
        const base = Math.floor(existingStock / standardSizes.length);
        const remainder = existingStock % standardSizes.length;
        const newSizeStock = {};

        standardSizes.forEach((sz, idx) => {
          newSizeStock[sz] = base + (idx < remainder ? 1 : 0);
        });

        const totalStock = Object.values(newSizeStock).reduce((sum, v) => sum + v, 0);

        await col.updateOne(
          { _id: prod._id },
          {
            $set: {
              sizeStock: newSizeStock,
              stockQuantity: totalStock,
              sizes: standardSizes,
              inStock: totalStock > 0
            }
          }
        );

        console.log(`  ✓ Updated "${prod.name}" (ID: ${prod._id}) -> Total: ${totalStock} | S=${newSizeStock.S}, M=${newSizeStock.M}, L=${newSizeStock.L}, XL=${newSizeStock.XL}, XXL=${newSizeStock.XXL}`);
        updatedCount++;
      } else {
        console.log(`  - Product "${prod.name}" already has sizeStock:`, prod.sizeStock);
      }
    }

    console.log(`\n🎉 Migration complete! Successfully updated ${updatedCount} products with size-wise stock in MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
