import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function inspectDetails() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const notifTypes = await db.collection('notifications').aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Notification types:', notifTypes);
  await mongoose.disconnect();
}
inspectDetails();
