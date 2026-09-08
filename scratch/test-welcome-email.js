import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../server/src/config/db.js';
import { User } from '../server/src/models/User.js';
import { sendWelcomeEmail } from '../server/src/services/emailService.js';

const testRegistrationAndWelcomeEmail = async () => {
  try {
    console.log('--- Connecting to DB ---');
    await connectDB();

    const testEmail = 'saggurthisubbu9@gmail.com';
    const testName = 'Subbu Saggurthi';

    console.log(`\nTesting sendWelcomeEmail with real email: ${testEmail}...`);

    // Find or create test user
    let user = await User.findOne({ email: testEmail });
    if (!user) {
      user = await User.create({
        name: testName,
        email: testEmail,
        password: 'Password123!',
        phone: '+91 7396629821',
        role: 'customer'
      });
      console.log('Created new test user:', user._id);
    } else {
      console.log('Found existing test user:', user._id);
    }

    console.log('\nInvoking sendWelcomeEmail(user)...');
    const result = await sendWelcomeEmail(user);
    console.log('\nsendWelcomeEmail Result:', result);

    const updatedUser = await User.findById(user._id);
    console.log('\nUpdated User emailStatus in MongoDB:', updatedUser.emailStatus);
    console.log('Updated User welcomeEmailSentAt in MongoDB:', updatedUser.welcomeEmailSentAt);

    console.log('\n✅ Verification Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
};

testRegistrationAndWelcomeEmail();
