import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);

    return NextResponse.json({
      success: true,
      message: 'This is a shared page accessible to all authenticated users',
      user: {
        id: user.userId,
        loginId: user.loginId,
        role: user.role,
      },
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
