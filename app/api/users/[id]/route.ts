import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth } from '@/lib/auth';
import { validateUpdateUser } from '@/lib/validators/userValidator';
import { handleError } from '@/lib/errorHandler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    getAuth(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    getAuth(request);
    const { id } = await params;
    const body = await request.json();

    const { error, value } = validateUpdateUser(body, { id });

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

    const { email, name } = (value?.body ?? body) as { email?: string; name?: string | null };

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e && typeof e === 'object' && 'code' in e) {
      if (e.code === 'P2025') {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      if (e.code === 'P2002') {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    getAuth(request);
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
