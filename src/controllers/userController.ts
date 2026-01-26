import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

/**
 * Get all users
 */
export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user by ID
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
        return;
      }
    }
    next(error);
  }
};

/**
 * Delete user by ID
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    next(error);
  }
};
