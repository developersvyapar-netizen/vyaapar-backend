import { NextRequest, NextResponse } from 'next/server';
import { getAuth, requireSalesperson } from '@/lib/auth';
import cartService from '@/lib/services/cartService';
import { validateSetSupplier } from '@/lib/validators/cartValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * PUT /api/cart/supplier
 * Set supplier for cart (validated against buyer hierarchy)
 * Body: { supplierId }
 * Access: SALESPERSON only
 */
export async function PUT(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const body = await request.json().catch(() => ({}));
    const { error, value } = validateSetSupplier(body);

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

    const cart = await cartService.setSupplier(user.userId, value!.supplierId);

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
