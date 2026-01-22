import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
};

// Validate required environment variables
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required in environment variables');
}
