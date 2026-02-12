import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { handleError } from '@/lib/errorHandler';
import { validateCreateRetailerOrder } from '@/lib/validators/retailerOrderValidator';
import retailerOrderService from '@/lib/services/retailerOrderService';

/**
 * POST /api/retailer/orders
 * Retailer creates an order directly (no salesperson or cart needed).
 * The logged-in retailer is automatically the buyer.
 *
 * Body: { supplierId, items: [{ productId, quantity }], notes? }
 * Access: RETAILER only
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuth(request);

    if (user.role !== 'RETAILER') {
      throw new AppError('Access denied. Only retailers can place direct orders.', 403);
    }

    const body = await request.json();
    const { error, value } = validateCreateRetailerOrder(body);

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

    const { supplierId, items, notes } = value!;

    const order = await retailerOrderService.createOrder(
      user.userId,
      supplierId,
      items,
      notes
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully',
        data: order,
      },
      { status: 201 }
    );
  } catch (err) {
    const { status, body: respBody } = handleError(err as Error, request);
    return NextResponse.json(respBody, { status });
  }
}
