import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function verifyUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'authtest@example.com' });
    if (user) {
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      await user.save();
      console.log('✅ User verified: authtest@example.com');
    } else {
      console.log('❌ User not found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
verifyUser();
