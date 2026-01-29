import { NextRequest, NextResponse } from 'next/server';
import attendanceService from '@/lib/services/attendanceService';
import { getAuth, requireAdmin } from '@/lib/auth';
import { validateAttendanceReportQuery } from '@/lib/validators/attendanceValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * GET /api/attendance/all
 * Get all salespersons' attendance records
 * Access: ADMIN only
 * Query params: salespersonId?, startDate?, endDate?, date?, page?, limit?
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireAdmin(user);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    if (searchParams.get('salespersonId')) {
      queryParams.salespersonId = searchParams.get('salespersonId');
    }
    if (searchParams.get('startDate')) {
      queryParams.startDate = searchParams.get('startDate');
    }
    if (searchParams.get('endDate')) {
      queryParams.endDate = searchParams.get('endDate');
    }
    if (searchParams.get('date')) {
      queryParams.date = searchParams.get('date');
    }
    if (searchParams.get('page')) {
      queryParams.page = parseInt(searchParams.get('page') as string, 10);
    }
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit') as string, 10);
    }

    // Validate query parameters
    const { error, value } = validateAttendanceReportQuery(queryParams);

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

    const result = await attendanceService.getAllAttendance(value!);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
