import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function inspectStores() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const stores = await db.collection('stores').find({}).toArray();
  const settings = await db.collection('settings').find({}).toArray();
  console.log('Stores:', stores.map(s => ({ name: s.name, totalOrders: s.totalOrders, revenue: s.revenue })));
  console.log('Settings:', settings);
  await mongoose.disconnect();
}
inspectStores();
