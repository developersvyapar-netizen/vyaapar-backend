import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './config/database.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

// Initialize Express app
const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Database connection check function
const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection failed:', { error });
    return false;
  }
};

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  
  if (dbConnected) {
    res.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: 'Server is running but database is not connected',
      database: 'disconnected',
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server with database connection check
const startServer = async () => {
  try {
    // Check database connection before starting server
    logger.info('Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Server will start but database operations may fail.');
    } else {
      logger.info('✔ Database connection established successfully');
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
