import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/config/database';
import { getAuth, requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errorHandler';
import { AttendanceStatus } from '@prisma/client';

/**
 * GET /api/admin/salespersons
 * Get all salespersons with their attendance summary and order statistics.
 * Access: ADMIN or DEVELOPER only
 *
 * Returns:
 * - Salesperson basic info (id, name, loginId, email, phone)
 * - Attendance summary (total days, average hours, last login/logout)
 * - Order count (total orders created)
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuth(request);
    requireAdmin(user);

    // Get all salespersons
    const salespersons = await prisma.user.findMany({
      where: {
        role: 'SALESPERSON',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        loginId: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each salesperson, get attendance summary and order count
    const salespersonsWithStats = await Promise.all(
      salespersons.map(async (sp) => {
        // Get attendance statistics
        const [uniqueDates, completedSessions, lastAttendance] = await Promise.all([
          // Get unique dates (then count them)
          prisma.attendanceLog.findMany({
            where: { salespersonId: sp.id },
            select: { date: true },
            distinct: ['date'],
          }),
          // Completed sessions (logged out)
          prisma.attendanceLog.findMany({
            where: {
              salespersonId: sp.id,
              status: AttendanceStatus.LOGGED_OUT,
              totalHours: { not: null },
            },
            select: { totalHours: true },
          }),
          // Most recent attendance record
          prisma.attendanceLog.findFirst({
            where: { salespersonId: sp.id },
            orderBy: { date: 'desc' },
            select: {
              date: true,
              loginTime: true,
              logoutTime: true,
              status: true,
              totalHours: true,
            },
          }),
        ]);

        // Calculate average hours worked
        const totalHours = completedSessions.reduce(
          (sum, log) => sum + (log.totalHours ? Number(log.totalHours) : 0),
          0
        );
        const averageHours =
          completedSessions.length > 0 ? Math.round((totalHours / completedSessions.length) * 100) / 100 : 0;

        // Get order count
        const orderCount = await prisma.order.count({
          where: { salespersonId: sp.id },
        });

        return {
          ...sp,
          attendance: {
            totalDays: uniqueDates.length,
            completedSessions: completedSessions.length,
            averageHoursPerSession: averageHours,
            totalHoursWorked: Math.round(totalHours * 100) / 100,
            lastAttendance: lastAttendance
              ? {
                  date: lastAttendance.date,
                  loginTime: lastAttendance.loginTime,
                  logoutTime: lastAttendance.logoutTime,
                  status: lastAttendance.status,
                  totalHours: lastAttendance.totalHours ? Number(lastAttendance.totalHours) : null,
                }
              : null,
          },
          orders: {
            totalCount: orderCount,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        salespersons: salespersonsWithStats,
        total: salespersonsWithStats.length,
      },
    });
  } catch (err) {
    const { status, body } = handleError(err as Error, request);
    return NextResponse.json(body, { status });
  }
}
