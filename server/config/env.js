const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Required environment variables
const requiredVars = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables:\n   ${missing.join('\n   ')}`);
  console.error('\n   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  PORT:               process.env.PORT || 5000,
  NODE_ENV:           process.env.NODE_ENV || 'development',
  MONGO_URI:          process.env.MONGO_URI,
  JWT_ACCESS_SECRET:  process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY:  process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  REDIS_URL:          process.env.REDIS_URL || '',
  CLIENT_URL:         process.env.CLIENT_URL,
  CLOUDINARY: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key:    process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },
  SENDGRID_API_KEY:   process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@restaurantfinder.app',
  VAPID_PUBLIC_KEY:   process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY:  process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT:      process.env.VAPID_SUBJECT || 'mailto:admin@restaurantfinder.app',
};
