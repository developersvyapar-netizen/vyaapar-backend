import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth, requireRoleDashboard } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireRoleDashboard('SALESPERSON' as UserRole, user);

    const userId = user.userId;

    const orders = await prisma.order.findMany({
      where: { salespersonId: userId },
      include: {
        buyer: {
          select: { id: true, name: true, loginId: true },
        },
        supplier: {
          select: { id: true, name: true, loginId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      message: 'Salesperson dashboard',
      data: {
        orders,
        totalOrders: orders.length,
      },
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
