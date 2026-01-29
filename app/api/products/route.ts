import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

/**
 * GET /api/products
 * List all products (id, name, sku, price, unit)
 * Access: Any authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    getAuth(request);

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        unit: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
