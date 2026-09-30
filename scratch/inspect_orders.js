import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function checkOrders() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const orderCount = await db.collection('orders').countDocuments();
  const orders = await db.collection('orders').find({}).limit(10).toArray();
  const notifCount = await db.collection('notifications').countDocuments();
  console.log('Total orders:', orderCount);
  console.log('Sample orders:', orders.map(o => ({ orderId: o.orderId, customer: o.customer?.name, total: o.totalAmount, date: o.createdAt })));
  console.log('Total notifications:', notifCount);
  await mongoose.disconnect();
}
checkOrders();
