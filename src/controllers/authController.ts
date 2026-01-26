import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import authService from '../services/authService.js';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    loginId: string;
    role: UserRole;
  };
}

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      res.status(400).json({
        success: false,
        message: 'Login ID and password are required',
      });
      return;
    }

    const result = await authService.login({ loginId, password });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (admin only)
 */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { loginId, password, role, email, name, phone, address } = req.body;
    const createdBy = req.user?.userId;

    if (!createdBy) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!loginId || !password || !role || !email) {
      res.status(400).json({
        success: false,
        message: 'Login ID, password, role, and email are required',
      });
      return;
    }

    // Validate role
    const validRoles: UserRole[] = ['STOCKIST', 'DISTRIBUTOR', 'RETAILER', 'SALESPERSON'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    const user = await authService.createUser(
      {
        loginId,
        password,
        role,
        email,
        name,
        phone,
        address,
      },
      createdBy
    );

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await authService.getUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
