import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const res = await db.collection('products').deleteMany({ name: { $regex: '^VERIFIED TEST PRODUCT' } });
  console.log('Cleaned up test products count:', res.deletedCount);
  await mongoose.disconnect();
}
cleanup();
