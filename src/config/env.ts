import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Validate required environment variables
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required in environment variables');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required in environment variables');
}
