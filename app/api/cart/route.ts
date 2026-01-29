import { NextRequest, NextResponse } from 'next/server';
import { getAuth, requireSalesperson } from '@/lib/auth';
import cartService from '@/lib/services/cartService';
import { handleError } from '@/lib/errorHandler';

/**
 * GET /api/cart
 * Get current cart with items
 * Access: SALESPERSON only
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    const cart = await cartService.getCart(user.userId);

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}

/**
 * DELETE /api/cart
 * Clear entire cart
 * Access: SALESPERSON only
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireSalesperson(user);

    await cartService.clearCart(user.userId);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
