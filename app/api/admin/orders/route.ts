import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth, requireAdmin } from '@/lib/auth';
import { validateAdminOrdersQuery } from '@/lib/validators/adminValidator';
import { handleError } from '@/lib/errorHandler';
import { OrderStatus } from '@prisma/client';

/**
 * GET /api/admin/orders
 * Get all orders with filtering and pagination.
 * Access: ADMIN or DEVELOPER only
 *
 * Query Parameters:
 * - status?: OrderStatus (PENDING, APPROVED, REJECTED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 * - startDate?: ISO date string
 * - endDate?: ISO date string
 * - buyerId?: UUID
 * - supplierId?: UUID
 * - salespersonId?: UUID (null for retailer self-orders)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    // Parse query parameters
    if (searchParams.get('status')) {
      queryParams.status = searchParams.get('status');
    }
    if (searchParams.get('startDate')) {
      queryParams.startDate = searchParams.get('startDate');
    }
    if (searchParams.get('endDate')) {
      queryParams.endDate = searchParams.get('endDate');
    }
    if (searchParams.get('buyerId')) {
      queryParams.buyerId = searchParams.get('buyerId');
    }
    if (searchParams.get('supplierId')) {
      queryParams.supplierId = searchParams.get('supplierId');
    }
    if (searchParams.get('salespersonId')) {
      queryParams.salespersonId = searchParams.get('salespersonId');
    }
    if (searchParams.get('page')) {
      queryParams.page = parseInt(searchParams.get('page') as string, 10);
    }
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit') as string, 10);
    }

    // Validate query parameters
    const { error, value } = validateAdminOrdersQuery(queryParams);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
        },
        { status: 400 }
      );
    }

    const { status, startDate, endDate, buyerId, supplierId, salespersonId, page = 1, limit = 20 } = value!;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (buyerId) {
      where.buyerId = buyerId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (salespersonId !== undefined) {
      // Handle null salespersonId (retailer self-orders)
      if (salespersonId === 'null' || salespersonId === null) {
        where.salespersonId = null;
      } else {
        where.salespersonId = salespersonId;
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, name: true, loginId: true, role: true },
          },
          supplier: {
            select: { id: true, name: true, loginId: true, role: true },
          },
          salesperson: {
            select: { id: true, name: true, loginId: true },
          },
          orderLines: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
