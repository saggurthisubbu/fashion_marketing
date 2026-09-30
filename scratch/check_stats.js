import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function checkAnalytics() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const totalOrders = await db.collection('orders').countDocuments();
  const revenueResult = await db.collection('orders').aggregate([
    { $match: { deliveryStatus: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).toArray();
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
  console.log('Current Dashboard Stats:');
  console.log('Total Orders:', totalOrders);
  console.log('Total Revenue:', totalRevenue);
  await mongoose.disconnect();
}
checkAnalytics();
