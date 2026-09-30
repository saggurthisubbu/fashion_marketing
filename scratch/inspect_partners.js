import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function inspectPartners() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const partners = await db.collection('deliverypartners').find({}).toArray();
  console.log('Delivery Partners:', partners.map(p => ({ name: p.name, status: p.status, activeOrders: p.activeOrdersCount || p.activeOrders })));
  await mongoose.disconnect();
}
inspectPartners();
