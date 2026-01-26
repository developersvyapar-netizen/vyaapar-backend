import express from 'express';
import { login, createUser, getCurrentUser } from '../controllers/authController.js';
import { validateLogin, validateCreateUser } from '../validators/authValidator.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleAuth.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

// Admin only routes
router.post('/users', authenticate, requireAdmin, validateCreateUser, createUser);

export default router;
