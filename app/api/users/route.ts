import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    getAuth(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        loginId: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
