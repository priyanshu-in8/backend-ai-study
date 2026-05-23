import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function verifyTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and verify the test user
    const user = await User.findOne({ email: 'test2@example.com' });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    console.log(`✅ User ${user.email} verified successfully`);
    console.log(`User ID: ${user._id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyTestUser();
