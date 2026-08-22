import 'dotenv/config';
import { connectDB } from '../server/src/config/db.js';
import { Product } from '../server/src/models/Product.js';
import { Category } from '../server/src/models/Category.js';

async function check() {
  await connectDB();
  const prods = await Product.find({});
  console.log('--- ALL PRODUCTS ---');
  prods.forEach(p => {
    console.log(`${p._id} | ${p.name} | sub: ${p.subcategory} | img: ${p.image} | images: ${JSON.stringify(p.images)}`);
  });

  const cats = await Category.find({});
  console.log('--- CATEGORIES ---');
  cats.forEach(c => console.log(`${c._id} | ${c.name} | slug: ${c.slug} | img: ${c.image}`));

  process.exit(0);
}

check().catch(console.error);
