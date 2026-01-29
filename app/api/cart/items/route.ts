import { NextRequest, NextResponse } from 'next/server';
import { getAuth, requireSalesperson } from '@/lib/auth';
import cartService from '@/lib/services/cartService';
import { validateAddCartItem } from '@/lib/validators/cartValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * POST /api/cart/items
 * Add item to cart
 * Body: { productId, quantity }
 * Access: SALESPERSON only
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const body = await request.json().catch(() => ({}));
    const { error, value } = validateAddCartItem(body);

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

    const item = await cartService.addItem(user.userId, value!.productId, value!.quantity);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
