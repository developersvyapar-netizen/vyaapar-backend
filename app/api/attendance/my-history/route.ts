import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import attendanceService from '@/lib/services/attendanceService';
import { getAuth } from '@/lib/auth';
import { validateMyHistoryQuery } from '@/lib/validators/attendanceValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * GET /api/attendance/my-history
 * Get attendance history for the logged-in salesperson
 * Access: SALESPERSON only
 * Query params: startDate?, endDate?, page?, limit?
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);

    // Only salespersons can use this endpoint
    if (user.role !== UserRole.SALESPERSON) {
      return NextResponse.json(
        { success: false, message: 'Only salespersons can view their attendance history' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    if (searchParams.get('startDate')) {
      queryParams.startDate = searchParams.get('startDate');
    }
    if (searchParams.get('endDate')) {
      queryParams.endDate = searchParams.get('endDate');
    }
    if (searchParams.get('page')) {
      queryParams.page = parseInt(searchParams.get('page') as string, 10);
    }
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit') as string, 10);
    }

    // Validate query parameters
    const { error, value } = validateMyHistoryQuery(queryParams);

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

    const result = await attendanceService.getMyHistory(user.userId, value!);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
