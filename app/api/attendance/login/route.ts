import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import attendanceService from '@/lib/services/attendanceService';
import { getAuth } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';

/**
 * POST /api/attendance/login
 * Record login time for salesperson
 * Access: SALESPERSON only
 */
export async function POST(request: NextRequest) {
  try {
    const user = getAuth(request);

    // Only salespersons can use this endpoint
    if (user.role !== UserRole.SALESPERSON) {
      return NextResponse.json(
        { success: false, message: 'Only salespersons can record attendance' },
        { status: 403 }
      );
    }

    const result = await attendanceService.recordLogin(user.userId);

    return NextResponse.json({
      success: true,
      message: 'Login time recorded successfully',
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}

/**
 * GET /api/attendance/login
 * Get today's attendance status for salesperson
 * Access: SALESPERSON only
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);

    // Only salespersons can use this endpoint
    if (user.role !== UserRole.SALESPERSON) {
      return NextResponse.json(
        { success: false, message: 'Only salespersons can check attendance status' },
        { status: 403 }
      );
    }

    const result = await attendanceService.getTodayStatus(user.userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
