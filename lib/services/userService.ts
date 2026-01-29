import { Prisma } from '@prisma/client';
import prisma from '@/lib/config/database';
import { AppError } from '@/lib/errors/AppError';

interface UpdateUserData {
  email?: string;
  name?: string | null;
}

/**
 * User service - Business logic layer
 */
class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserById(id: string) {
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
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserData) {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...(data.email && { email: data.email }),
          ...(data.name !== undefined && { name: data.name }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError('User not found', 404);
        }
        if (error.code === 'P2002') {
          throw new AppError('Email already exists', 409);
        }
      }
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError('User not found', 404);
        }
      }
      throw error;
    }
  }
}

export default new UserService();
