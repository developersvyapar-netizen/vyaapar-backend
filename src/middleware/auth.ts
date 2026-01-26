import { Response, NextFunction } from 'express';
import authService from '../services/authService.js';
import { AuthRequest } from '../controllers/authController.js';

/**
 * Authentication middleware - Verifies JWT token and attaches user to request
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Please login to access this resource.',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      loginId: payload.loginId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      res.status((error as { statusCode: number }).statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};

/**
 * Optional authentication - Attaches user if token is present, but doesn't require it
 */
export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = {
        userId: payload.userId,
        loginId: payload.loginId,
        role: payload.role,
      };
    }

    next();
  } catch (_error) {
    // If token is invalid, just continue without user (optional auth)
    next();
  }
};
