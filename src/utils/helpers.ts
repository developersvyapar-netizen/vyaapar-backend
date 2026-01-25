/**
 * Utility helper functions
 */

/**
 * Format API response
 */
export const formatResponse = (
  success: boolean,
  data?: unknown,
  message: string | null = null
): { success: boolean; data?: unknown; message?: string } => {
  const response: { success: boolean; data?: unknown; message?: string } = {
    success,
  };
  if (data) {
    response.data = data;
  }
  if (message) {
    response.message = message;
  }
  return response;
};

/**
 * Generate pagination metadata
 */
export const getPagination = (
  page: number | string = 1,
  limit: number | string = 10
): { skip: number; take: number; page: number; limit: number } => {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  const skip = (pageNum - 1) * limitNum;
  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

/**
 * Format paginated response
 */
export const formatPaginatedResponse = (
  data: unknown[],
  total: number,
  page: number,
  limit: number
): {
  success: boolean;
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Sanitize object - remove undefined values
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
