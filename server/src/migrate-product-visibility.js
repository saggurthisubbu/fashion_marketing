import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Product } from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set in environment.');

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const result = await Product.updateMany(
      {},
      {
        $set: {
          isActive: true,
          published: true,
          inStock: true
        }
      }
    );

    console.log(`Successfully migrated products: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

    const all = await Product.find({}).lean();
    console.log(`Current product inventory count: ${all.length}`);
    all.forEach((p, idx) => {
      console.log(`[${idx + 1}] "${p.name}" | Subcategory: ${p.subcategory} | inStock: ${p.inStock} | isActive: ${p.isActive} | published: ${p.published}`);
    });

    await mongoose.disconnect();
    console.log('Migration finished.');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
