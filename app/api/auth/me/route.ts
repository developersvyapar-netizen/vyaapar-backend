import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';
import { getAuth } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    const profile = await authService.getUserById(user.userId);
    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
