import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../controllers/authController.js';

/**
 * Role-based access control middleware
 * Ensures user has one of the required roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // First ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access this resource.',
      });
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole('ADMIN', 'DEVELOPER');

/**
 * Check if user can access their own dashboard based on role
 * Each role can only access their own order dashboard
 */
export const requireOwnDashboard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login to access this resource.',
    });
    return;
  }

  // Get the requested user ID from params or query
  const requestedUserId = req.params.userId || req.query.userId as string;

  // If no specific user ID requested, allow access to own dashboard
  if (!requestedUserId) {
    next();
    return;
  }

  // Users can only access their own dashboard
  if (requestedUserId !== req.user.userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own dashboard.',
    });
    return;
  }

  next();
};

/**
 * Role-specific dashboard access
 * Ensures users can only access dashboards for their role
 */
export const requireRoleDashboard = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access this resource.',
      });
      return;
    }

    // Check if user's role matches the required role for this dashboard
    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Access denied. This dashboard is only accessible to ${role} users.`,
      });
      return;
    }

    next();
  };
};
