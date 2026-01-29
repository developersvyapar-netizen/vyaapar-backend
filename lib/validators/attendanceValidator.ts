import Joi from 'joi';

// Schema for attendance report query parameters
const attendanceReportSchema = Joi.object({
  salespersonId: Joi.string().uuid().optional().messages({
    'string.guid': 'Invalid salesperson ID format',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
}).custom((value, helpers) => {
  // If both date and date range are provided, prefer date
  if (value.date && (value.startDate || value.endDate)) {
    return { ...value, startDate: undefined, endDate: undefined };
  }
  // If only one of startDate/endDate is provided, that's okay
  return value;
});

// Schema for my-history query parameters
const myHistorySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export interface AttendanceReportQuery {
  salespersonId?: string;
  startDate?: Date;
  endDate?: Date;
  date?: Date;
  page: number;
  limit: number;
}

export interface MyHistoryQuery {
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export function validateAttendanceReportQuery(
  query: Record<string, unknown>
): { error?: { details: { path: string[]; message: string }[] }; value?: AttendanceReportQuery } {
  const { error, value } = attendanceReportSchema.validate(query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      error: {
        details: error.details.map((d) => ({ path: d.path as string[], message: d.message })),
      },
    };
  }

  return { value: value as AttendanceReportQuery };
}

export function validateMyHistoryQuery(
  query: Record<string, unknown>
): { error?: { details: { path: string[]; message: string }[] }; value?: MyHistoryQuery } {
  const { error, value } = myHistorySchema.validate(query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      error: {
        details: error.details.map((d) => ({ path: d.path as string[], message: d.message })),
      },
    };
  }

  return { value: value as MyHistoryQuery };
}
