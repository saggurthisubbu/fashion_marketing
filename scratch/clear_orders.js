import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const MONGO_URI = 'mongodb+srv://saggurthisubbu9_db_user:Quickfit123@cluster0.hh4vqrt.mongodb.net/quickfit?retryWrites=true&w=majority';

async function clearOrdersAndResetStats() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Delete all dummy/test orders
    const deletedOrders = await db.collection('orders').deleteMany({});
    console.log(`Deleted ${deletedOrders.deletedCount} orders from 'orders' collection.`);

    // 2. Delete all order & delivery notifications
    const deletedNotifs = await db.collection('notifications').deleteMany({
      $or: [
        { type: 'order' },
        { type: 'delivery' },
        { orderId: { $exists: true } }
      ]
    });
    console.log(`Deleted ${deletedNotifs.deletedCount} notifications related to test orders.`);

    // 3. Reset delivery partners status to Available and activeOrdersCount to 0
    const updatedPartners = await db.collection('deliverypartners').updateMany(
      {},
      { $set: { status: 'Available', activeOrdersCount: 0 } }
    );
    console.log(`Reset ${updatedPartners.modifiedCount} delivery partners to Available.`);

    // 4. Verify count
    const remainingOrders = await db.collection('orders').countDocuments();
    console.log(`Remaining orders: ${remainingOrders}`);

    console.log('✅ All dummy/test orders cleared and dashboard statistics reset successfully!');
  } catch (err) {
    console.error('Error clearing orders:', err);
  } finally {
    await mongoose.disconnect();
  }
}

clearOrdersAndResetStats();
