import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'SMTP_USER',
  'SMTP_PASS',
  'SENDER_EMAIL',
  'EMAIL_SERVICE',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'CLIENT_URL',
  'BASE_URL'
];

const optionalEnvVars = [
  'GROQ_API_KEY',
  'NVIDIA_API_KEY',
  'XAI_API_KEY',
  'CLOUD_NAME',
  'API_KEY',
  'API_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];

console.log('🔍 Validating Environment Configuration...\n');

let errors = [];
let warnings = [];

// Check required variables
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    errors.push(`Missing required: ${varName}`);
  } else {
    // Check for development values in production
    if (process.env.NODE_ENV === 'production') {
      if (value.includes('localhost') || value.includes('127.0.0.1')) {
        warnings.push(`${varName} contains localhost in production mode`);
      }
      if (varName === 'JWT_SECRET' && value.length < 32) {
        errors.push(`JWT_SECRET must be at least 32 characters (currently ${value.length})`);
      }
    }
  }
});

// Check optional variables
optionalEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    warnings.push(`Optional variable not set: ${varName}`);
  }
});

// Check NODE_ENV value
const nodeEnv = process.env.NODE_ENV;
if (!['development', 'production', 'staging'].includes(nodeEnv)) {
  errors.push(`Invalid NODE_ENV: ${nodeEnv}. Must be: development, production, or staging`);
}

// Validate DATABASE connection string format
if (process.env.MONGODB_URI) {
  if (!process.env.MONGODB_URI.startsWith('mongodb')) {
    errors.push('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
  }
}

// Display results
if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(err => console.log(`   • ${err}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(`   • ${warn}`));
  console.log();
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All environment variables are correctly configured!\n');
} else if (errors.length === 0) {
  console.log('✅ No critical errors found. Warnings can be addressed.\n');
}

console.log('📊 Configuration Summary:');
console.log(`   • Environment: ${process.env.NODE_ENV}`);
console.log(`   • Port: ${process.env.PORT}`);
console.log(`   • Database: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`);
console.log(`   • JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
console.log(`   • Email Service: ${process.env.EMAIL_SERVICE}`);
console.log(`   • Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   • Frontend URL: ${process.env.CLIENT_URL}`);
console.log();

// Exit with error code if there are critical errors
if (errors.length > 0) {
  process.exit(1);
}
