import { NextRequest, NextResponse } from 'next/server';
import { getAuth, requireSalesperson } from '@/lib/auth';
import cartService from '@/lib/services/cartService';
import { validateUpdateCartItem } from '@/lib/validators/cartValidator';
import { handleError } from '@/lib/errorHandler';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PUT /api/cart/items/:itemId
 * Update cart item quantity
 * Body: { quantity }
 * Access: SALESPERSON only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const { itemId } = await params;
    if (!UUID_REGEX.test(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid item ID format' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { error, value } = validateUpdateCartItem(body);

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

    const item = await cartService.updateItem(user.userId, itemId, value!.quantity);

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 * Access: SALESPERSON only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const { itemId } = await params;
    if (!UUID_REGEX.test(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid item ID format' },
        { status: 400 }
      );
    }

    await cartService.removeItem(user.userId, itemId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
