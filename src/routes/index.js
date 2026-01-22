import express from 'express';
import userRoutes from './userRoutes.js';

const router = express.Router();

// API routes
router.use('/users', userRoutes);

export default router;
