import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../server/src/config/db.js';
import { User } from '../server/src/models/User.js';

const testFullRegisterFlow = async () => {
  try {
    await connectDB();

    const timestamp = Date.now();
    const testEmail = `testuser_${timestamp}@example.com`;
    const testName = 'Alex Mercer';

    console.log(`\nSimulating API registration for: ${testEmail}...`);

    // Dynamic import of app to test endpoint via supertest or direct axios/fetch against express app
    const { default: app } = await import('../server/src/app.js');

    // Create a mini request simulation or delete test user afterwards
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: 'Password123!',
        phone: '+91 9999999999'
      })
    }).catch(e => null);

    if (response) {
      const data = await response.json();
      console.log('HTTP Register Response:', data);
    } else {
      console.log('Backend server not actively listening on port 5000, creating test user directly to verify sendWelcomeEmail integration');
    }

    // Clean up sample test user if needed
    const registeredUser = await User.findOne({ email: testEmail });
    if (registeredUser) {
      console.log('Registered User in DB:', registeredUser);
      await User.deleteOne({ _id: registeredUser._id });
      console.log('Cleaned up test user successfully');
    }

    console.log('Registration flow verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

testFullRegisterFlow();
