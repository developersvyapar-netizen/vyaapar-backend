import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { AppError } from '@/lib/errors/AppError';
import { handleError } from '@/lib/errorHandler';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'DEVELOPER'];

/**
 * GET /api/orders/:id
 * Get a single order with full details (order lines, buyer, supplier, salesperson).
 * Access: ADMIN, DEVELOPER, or the salesperson who created the order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuth(request);
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderLines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, loginId: true, role: true, email: true, phone: true },
        },
        supplier: {
          select: { id: true, name: true, loginId: true, role: true, email: true, phone: true },
        },
        salesperson: {
          select: { id: true, name: true, loginId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const isAdmin = ADMIN_ROLES.includes(user.role);
    const isOrderSalesperson = order.salespersonId && user.userId === order.salespersonId;
    const isOrderBuyer = user.userId === order.buyerId;
    const isOrderSupplier = user.userId === order.supplierId;

    if (!isAdmin && !isOrderSalesperson && !isOrderBuyer && !isOrderSupplier) {
      throw new AppError('Access denied. You can only view orders you are part of, or have admin access.', 403);
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
