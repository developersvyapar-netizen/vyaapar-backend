import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma, UserRole } from '@prisma/client';
import prisma from '../config/database.js';
import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

interface LoginCredentials {
  loginId: string;
  password: string;
}

interface CreateUserData {
  loginId: string;
  password: string;
  role: UserRole;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
}

interface AuthTokenPayload {
  userId: string;
  loginId: string;
  role: UserRole;
}

/**
 * Auth service - Handles authentication and authorization logic
 */
class AuthService {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: AuthTokenPayload): string {
    const expiresIn = config.jwtExpiresIn;
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw new AppError('Token verification failed', 401);
    }
  }

  /**
   * Login user with loginId and password
   */
  async login(credentials: LoginCredentials) {
    const { loginId, password } = credentials;

    // Find user by loginId
    const user = await prisma.user.findUnique({
      where: { loginId },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid login credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid login credentials', 401);
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      loginId: user.loginId,
      role: user.role,
    });

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: CreateUserData, createdBy: string) {
    try {
      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          loginId: data.loginId,
          password: hashedPassword,
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone,
          address: data.address,
          createdBy,
        },
        select: {
          id: true,
          loginId: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          if (field?.includes('loginId')) {
            throw new AppError('Login ID already exists', 409);
          }
          if (field?.includes('email')) {
            throw new AppError('Email already exists', 409);
          }
          throw new AppError('User with this information already exists', 409);
        }
      }
      throw error;
    }
  }

  /**
   * Get user by ID (for authentication checks)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

export default new AuthService();
