import { Prisma, AttendanceStatus } from '@prisma/client';
import prisma from '@/lib/config/database';
import { AppError } from '@/lib/errors/AppError';

interface AttendanceReportFilters {
  salespersonId?: string;
  startDate?: Date;
  endDate?: Date;
  date?: Date;
  page: number;
  limit: number;
}

interface MyHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

/**
 * Attendance service - Handles salesperson attendance tracking
 */
class AttendanceService {
  /**
   * Get today's date at midnight (UTC)
   */
  private getTodayDate(): Date {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Calculate hours between two dates
   */
  private calculateHours(loginTime: Date, logoutTime: Date): number {
    const diffMs = logoutTime.getTime() - loginTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Record login time for salesperson
   */
  async recordLogin(salespersonId: string) {
    const today = this.getTodayDate();
    const now = new Date();

    // Check if already logged in today
    const existingLog = await prisma.attendanceLog.findUnique({
      where: {
        salespersonId_date: {
          salespersonId,
          date: today,
        },
      },
    });

    if (existingLog) {
      throw new AppError('You have already logged in today', 400);
    }

    // Create new attendance log
    const attendanceLog = await prisma.attendanceLog.create({
      data: {
        salespersonId,
        loginTime: now,
        date: today,
        status: AttendanceStatus.LOGGED_IN,
      },
      include: {
        salesperson: {
          select: {
            id: true,
            name: true,
            loginId: true,
            email: true,
          },
        },
      },
    });

    return {
      id: attendanceLog.id,
      loginTime: attendanceLog.loginTime,
      date: attendanceLog.date,
      status: attendanceLog.status,
      salesperson: attendanceLog.salesperson,
    };
  }

  /**
   * Record logout time for salesperson
   */
  async recordLogout(salespersonId: string) {
    const today = this.getTodayDate();
    const now = new Date();

    // Find today's login record
    const attendanceLog = await prisma.attendanceLog.findUnique({
      where: {
        salespersonId_date: {
          salespersonId,
          date: today,
        },
      },
    });

    if (!attendanceLog) {
      throw new AppError('You have not logged in today. Please login first.', 400);
    }

    if (attendanceLog.status === AttendanceStatus.LOGGED_OUT) {
      throw new AppError('You have already logged out today', 400);
    }

    // Calculate total hours worked
    const totalHours = this.calculateHours(attendanceLog.loginTime, now);

    // Update attendance log with logout time
    const updatedLog = await prisma.attendanceLog.update({
      where: { id: attendanceLog.id },
      data: {
        logoutTime: now,
        totalHours: new Prisma.Decimal(totalHours),
        status: AttendanceStatus.LOGGED_OUT,
      },
      include: {
        salesperson: {
          select: {
            id: true,
            name: true,
            loginId: true,
            email: true,
          },
        },
      },
    });

    return {
      id: updatedLog.id,
      loginTime: updatedLog.loginTime,
      logoutTime: updatedLog.logoutTime,
      date: updatedLog.date,
      totalHours: updatedLog.totalHours,
      status: updatedLog.status,
      salesperson: updatedLog.salesperson,
    };
  }

  /**
   * Get attendance history for a specific salesperson (for salesperson's own view)
   */
  async getMyHistory(salespersonId: string, filters: MyHistoryFilters) {
    const { startDate, endDate, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceLogWhereInput = {
      salespersonId,
    };

    // Apply date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          loginTime: true,
          logoutTime: true,
          date: true,
          totalHours: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get today's attendance status for a salesperson
   */
  async getTodayStatus(salespersonId: string) {
    const today = this.getTodayDate();

    const attendanceLog = await prisma.attendanceLog.findUnique({
      where: {
        salespersonId_date: {
          salespersonId,
          date: today,
        },
      },
      select: {
        id: true,
        loginTime: true,
        logoutTime: true,
        date: true,
        totalHours: true,
        status: true,
      },
    });

    if (!attendanceLog) {
      return {
        hasLoggedIn: false,
        hasLoggedOut: false,
        status: null,
        loginTime: null,
        logoutTime: null,
      };
    }

    return {
      hasLoggedIn: true,
      hasLoggedOut: attendanceLog.status === AttendanceStatus.LOGGED_OUT,
      status: attendanceLog.status,
      loginTime: attendanceLog.loginTime,
      logoutTime: attendanceLog.logoutTime,
      totalHours: attendanceLog.totalHours,
    };
  }

  /**
   * Get all salespersons' attendance (Admin only)
   */
  async getAllAttendance(filters: AttendanceReportFilters) {
    const { salespersonId, startDate, endDate, date, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceLogWhereInput = {};

    // Filter by specific salesperson
    if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    // Filter by specific date
    if (date) {
      where.date = date;
    } else if (startDate || endDate) {
      // Filter by date range
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        orderBy: [{ date: 'desc' }, { loginTime: 'desc' }],
        skip,
        take: limit,
        include: {
          salesperson: {
            select: {
              id: true,
              name: true,
              loginId: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        loginTime: log.loginTime,
        logoutTime: log.logoutTime,
        date: log.date,
        totalHours: log.totalHours,
        status: log.status,
        salesperson: log.salesperson,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get attendance for a specific salesperson (Admin only)
   */
  async getSalespersonAttendance(salespersonId: string, filters: MyHistoryFilters) {
    // Verify salesperson exists and is a SALESPERSON
    const salesperson = await prisma.user.findUnique({
      where: { id: salespersonId },
      select: { id: true, name: true, loginId: true, email: true, role: true },
    });

    if (!salesperson) {
      throw new AppError('Salesperson not found', 404);
    }

    if (salesperson.role !== 'SALESPERSON') {
      throw new AppError('User is not a salesperson', 400);
    }

    const { startDate, endDate, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceLogWhereInput = {
      salespersonId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          loginTime: true,
          logoutTime: true,
          date: true,
          totalHours: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    return {
      salesperson: {
        id: salesperson.id,
        name: salesperson.name,
        loginId: salesperson.loginId,
        email: salesperson.email,
      },
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get attendance report summary (Admin only)
   */
  async getAttendanceReport(filters: AttendanceReportFilters) {
    const { salespersonId, startDate, endDate, date, page, limit } = filters;

    const where: Prisma.AttendanceLogWhereInput = {};

    if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    if (date) {
      where.date = date;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    // Get attendance data with pagination
    const attendanceData = await this.getAllAttendance(filters);

    // Get summary statistics
    const [totalLogs, loggedInCount, loggedOutCount, incompleteCount] = await Promise.all([
      prisma.attendanceLog.count({ where }),
      prisma.attendanceLog.count({ where: { ...where, status: AttendanceStatus.LOGGED_IN } }),
      prisma.attendanceLog.count({ where: { ...where, status: AttendanceStatus.LOGGED_OUT } }),
      prisma.attendanceLog.count({ where: { ...where, status: AttendanceStatus.INCOMPLETE } }),
    ]);

    // Calculate average hours for completed sessions
    const completedLogs = await prisma.attendanceLog.findMany({
      where: { ...where, status: AttendanceStatus.LOGGED_OUT, totalHours: { not: null } },
      select: { totalHours: true },
    });

    const totalHoursWorked = completedLogs.reduce(
      (sum, log) => sum + (log.totalHours ? Number(log.totalHours) : 0),
      0
    );
    const averageHours =
      completedLogs.length > 0 ? Math.round((totalHoursWorked / completedLogs.length) * 100) / 100 : 0;

    return {
      summary: {
        totalRecords: totalLogs,
        loggedIn: loggedInCount,
        loggedOut: loggedOutCount,
        incomplete: incompleteCount,
        totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
        averageHoursPerSession: averageHours,
      },
      ...attendanceData,
    };
  }
}

export default new AttendanceService();
