/**
 * Utility helper functions
 */

/**
 * Format API response
 */
export const formatResponse = (success, data, message = null) => {
  const response = {
    success,
    ...(data && { data }),
    ...(message && { message }),
  };
  return response;
};

/**
 * Generate pagination metadata
 */
export const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Format paginated response
 */
export const formatPaginatedResponse = (data, total, page, limit) => {
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
export const sanitizeObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
