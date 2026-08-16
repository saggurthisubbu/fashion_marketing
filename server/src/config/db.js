import mongoose from 'mongoose';
import dns from 'dns';

// Resolve DNS SRV records reliably on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // ignore
}

export const connectDB = async () => {
  // Guard: if already connected, skip reconnect attempt
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
    console.warn('[MONGODB] Notice: MONGODB_URI is using local/default connection. Use MongoDB Atlas in production.');
  }

  try {
    const conn = await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/quickfit', {
      serverSelectionTimeoutMS: 30000,  // 30s to select a server
      socketTimeoutMS: 45000,           // 45s socket timeout
      connectTimeoutMS: 30000,          // 30s connection timeout
      maxPoolSize: 10,                  // Connection pool for concurrent requests
      minPoolSize: 1,
      retryWrites: true
    });
    console.log(`[MONGODB] Connected successfully to host: ${conn.connection.host} | Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MONGODB] Connection error: ${error.message}`);
    // Do not crash server, allow retry
  }
};
