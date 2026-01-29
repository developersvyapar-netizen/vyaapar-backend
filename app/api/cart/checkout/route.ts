import { NextRequest, NextResponse } from 'next/server';
import { getAuth, requireSalesperson } from '@/lib/auth';
import cartService from '@/lib/services/cartService';
import { validateCheckout } from '@/lib/validators/cartValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * POST /api/cart/checkout
 * Create order from cart. Validates cart has items, buyer, and supplier. Clears cart on success.
 * Body: { notes? } (optional)
 * Access: SALESPERSON only
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const body = await request.json().catch(() => ({}));
    const { error, value } = validateCheckout(body);

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

    const order = await cartService.checkout(user.userId, value?.notes);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
