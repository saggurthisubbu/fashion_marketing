import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
    console.warn('⚠️ [MongoDB Warning]: MONGODB_URI is not set to a MongoDB Atlas remote URL in .env file.');
  }

  try {
    const conn = await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/quickfit');
    console.log(`✅ [MongoDB Connected]: Host -> ${conn.connection.host} | DB -> ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    // Do not crash server, allow fallback log
  }
};

