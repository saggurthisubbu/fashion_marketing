import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('server/.env') });

import { connectDB } from '../server/src/config/db.js';
import { Product } from '../server/src/models/Product.js';
import { Setting } from '../server/src/models/Setting.js';

async function init() {
  await connectDB();
  const prods = await Product.find({ isActive: { $ne: false } }).limit(6);
  const ids = prods.map(p => p._id);
  await Product.updateMany({}, { $set: { isHeroShowcase: false } });
  await Product.updateMany({ _id: { $in: ids } }, { $set: { isHeroShowcase: true } });

  let setting = await Setting.findOne();
  if (!setting) setting = new Setting();
  setting.heroShowcaseProductIds = ids;
  await setting.save();

  console.log('✅ Initialized 6 showcase products in MongoDB:');
  prods.forEach(p => console.log('  -', p.name, `(${p.subcategory})`));
  process.exit(0);
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});
