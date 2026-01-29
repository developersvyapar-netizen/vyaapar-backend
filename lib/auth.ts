import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import authService from '@/lib/services/authService';
import { AppError } from '@/lib/errors/AppError';

export interface AuthUser {
  userId: string;
  loginId: string;
  role: UserRole;
}

/**
 * Get authenticated user from request. Throws AppError(401) if no/invalid token.
 */
export function getAuth(request: NextRequest): AuthUser {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided. Please login to access this resource.', 401);
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  return {
    userId: payload.userId,
    loginId: payload.loginId,
    role: payload.role,
  };
}

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'DEVELOPER'];

export function requireAdmin(user: AuthUser): void {
  if (!ADMIN_ROLES.includes(user.role)) {
    throw new AppError('Access denied. You do not have permission to access this resource.', 403);
  }
}

export function requireRoleDashboard(role: UserRole, user: AuthUser): void {
  if (user.role !== role) {
    throw new AppError(`Access denied. This dashboard is only accessible to ${role} users.`, 403);
  }
}
