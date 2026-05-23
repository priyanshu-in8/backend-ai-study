import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createDevUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Pre-verified test user for development
    const devEmail = 'dev@test.com';
    const devPassword = 'dev123456';
    const devName = 'Dev User';

    // Check if user already exists
    let user = await User.findOne({ email: devEmail });

    if (user) {
      console.log(`\n⚠️  User ${devEmail} already exists`);
      console.log(`User ID: ${user._id}`);
      
      // Check if verified
      if (user.isVerified) {
        console.log('✅ User is already verified');
      } else {
        console.log('❌ User is NOT verified');
        console.log('   Verifying user now...');
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();
        console.log('✅ User verified successfully');
      }
    } else {
      // Create new user
      console.log(`\n📝 Creating new test user...`);
      user = await User.create({
        name: devName,
        email: devEmail,
        password: devPassword, // This will be hashed by the model
        educationType: 'school',
        educationLevel: '12',
        subjects: ['Math', 'Science', 'English'],
        isVerified: true, // Pre-verified for development
        verificationToken: null,
        verificationTokenExpires: null,
      });
      console.log('✅ User created successfully');
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✨ Development User Ready');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email: ${devEmail}`);
    console.log(`🔐 Password: ${devPassword}`);
    console.log(`👤 Name: ${devName}`);
    console.log(`🆔 ID: ${user._id}`);
    console.log(`✓ Verified: ${user.isVerified}`);
    console.log('═══════════════════════════════════════\n');

    console.log('You can now login from the frontend with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDevUser();
