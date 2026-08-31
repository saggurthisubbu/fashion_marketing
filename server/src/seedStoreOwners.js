import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { User } from './models/User.js';
import { Store } from './models/Store.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const seedStoreOwners = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickfit';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    const stores = await Store.find({});
    if (stores.length === 0) {
      console.log('No stores found in DB! Please seed stores or add them first.');
      process.exit(0);
    }

    console.log(`Found ${stores.length} stores. Seeding store owners...`);

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      const email = `owner${i + 1}@quickfit.com`;
      const password = 'owner123';
      const name = `${store.name} Manager`;

      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name,
          email,
          password,
          phone: store.contactNumber || '+91 7396629821',
          role: 'store_owner',
          assignedStoreId: store._id,
          adminId: `owner${i + 1}`,
          address: {
            street: store.address,
            area: 'Benz Circle',
            city: 'Vijayawada'
          }
        });
        await user.save();
        console.log(`Created store owner: ${email} (adminId: owner${i + 1}) for store ${store.name}`);
      } else {
        user.role = 'store_owner';
        user.assignedStoreId = store._id;
        user.adminId = `owner${i + 1}`;
        user.name = name;
        user.password = password; // pre-save hook will hash it
        await user.save();
        console.log(`Updated store owner: ${email} for store ${store.name}`);
      }
    }

    console.log('Store owners seeding complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding store owners:', error);
    process.exit(1);
  }
};

seedStoreOwners();
