import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';
import { validateLogin } from '@/lib/validators/authValidator';
import { handleError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, value } = validateLogin(body);

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

    if (!value?.loginId || !value?.password) {
      return NextResponse.json(
        { success: false, message: 'Login ID and password are required' },
        { status: 400 }
      );
    }

    const result = await authService.login({ loginId: value.loginId, password: value.password });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
