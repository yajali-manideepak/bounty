const path = require('path');
const dotenv = require('dotenv');

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || './server/data/bughunt.db',
  authSecret: process.env.AUTH_SECRET || 'dev_secret_fallback_key',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
};

module.exports = config;
