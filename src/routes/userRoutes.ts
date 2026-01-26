import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { validateUpdateUser } from '../validators/userValidator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// User routes (all require authentication)
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
// Note: User creation is now handled by /api/auth/users (admin only)
router.put('/:id', authenticate, validateUpdateUser, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;
