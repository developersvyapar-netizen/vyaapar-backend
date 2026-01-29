import { NextRequest, NextResponse } from 'next/server';
import attendanceService from '@/lib/services/attendanceService';
import { getAuth, requireAdmin } from '@/lib/auth';
import { validateMyHistoryQuery } from '@/lib/validators/attendanceValidator';
import { handleError } from '@/lib/errorHandler';

/**
 * GET /api/attendance/salesperson/:salespersonId
 * Get attendance records for a specific salesperson
 * Access: ADMIN only
 * Query params: startDate?, endDate?, page?, limit?
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salespersonId: string }> }
) {
  try {
    const user = getAuth(request);
    requireAdmin(user);

    const { salespersonId } = await params;

    // Validate salespersonId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(salespersonId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid salesperson ID format' },
        { status: 400 }
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

    const result = await attendanceService.getSalespersonAttendance(salespersonId, value!);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
