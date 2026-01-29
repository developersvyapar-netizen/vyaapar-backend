import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth, requireRoleDashboard } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireRoleDashboard('RETAILER' as UserRole, user);

    const userId = user.userId;

    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        supplier: {
          select: { id: true, name: true, loginId: true },
        },
        salesperson: {
          select: { id: true, name: true, loginId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      message: 'Retailer dashboard',
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
