import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { AppError } from '@/lib/errors/AppError';

interface PrismaError extends Error {
  code?: string;
}

interface ValidationError extends Error {
  name: string;
  errors?: unknown;
}

export function handleError(err: Error | AppError | PrismaError | ValidationError, _req: NextRequest) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
  });

  if ('code' in err && err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    return {
      status: 400,
      body: {
        success: false,
        message: 'Database error occurred',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
      },
    };
  }

  if (err.name === 'ValidationError') {
    return {
      status: 400,
      body: {
        success: false,
        message: 'Validation error',
        errors: 'errors' in err ? err.errors : undefined,
      },
    };
  }

  if ('statusCode' in err && typeof (err as AppError).statusCode === 'number') {
    return {
      status: (err as AppError).statusCode,
      body: {
        success: false,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    },
  };
}
