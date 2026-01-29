import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import authService from '@/lib/services/authService';
import { getAuth, requireAdmin } from '@/lib/auth';
import { validateCreateUser } from '@/lib/validators/authValidator';
import { handleError } from '@/lib/errorHandler';

const VALID_ROLES: UserRole[] = ['STOCKIST', 'DISTRIBUTOR', 'RETAILER', 'SALESPERSON'];

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuth(request);
    requireAdmin(authUser);

    const body = await request.json();
    const { error, value } = validateCreateUser(body);

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

    const { loginId, password, role, email, name, phone, address } = (value || body) as {
      loginId: string;
      password: string;
      role: UserRole;
      email: string;
      name?: string;
      phone?: string;
      address?: string;
    };

    if (!loginId || !password || !role || !email) {
      return NextResponse.json(
        { success: false, message: 'Login ID, password, role, and email are required' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const user = await authService.createUser(
      { loginId, password, role, email, name, phone, address },
      authUser.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    );
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
