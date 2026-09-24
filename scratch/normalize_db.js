import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function fix() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  for (const p of products) {
    let changed = false;
    let newImg = p.image;
    let newImages = { ...(p.images || {}) };

    if (newImg && newImg.includes('/api/upload/media/')) {
      const id = newImg.split('/api/upload/media/')[1].split(/[?#]/)[0];
      newImg = '/api/upload/media/' + id;
      changed = true;
    }

    for (const angle of ['front', 'back', 'left', 'right']) {
      if (newImages[angle] && newImages[angle].includes('/api/upload/media/')) {
        const id = newImages[angle].split('/api/upload/media/')[1].split(/[?#]/)[0];
        newImages[angle] = '/api/upload/media/' + id;
        changed = true;
      }
    }

    if (changed) {
      await db.collection('products').updateOne(
        { _id: p._id },
        { $set: { image: newImg, images: newImages } }
      );
      console.log('Normalized product in DB:', p.name, '->', newImg);
    }
  }
  console.log('Database normalization complete.');
  await mongoose.disconnect();
}
fix();
