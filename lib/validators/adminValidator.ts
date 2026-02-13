import Joi from 'joi';

export interface AdminOrdersQuery {
  status?: string;
  startDate?: string;
  endDate?: string;
  buyerId?: string;
  supplierId?: string;
  salespersonId?: string;
  page?: number;
  limit?: number;
}

const adminOrdersQuerySchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .optional(),
  startDate: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'startDate must be a valid ISO date string',
  }),
  endDate: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'endDate must be a valid ISO date string',
  }),
  buyerId: Joi.string().uuid().optional().messages({
    'string.guid': 'buyerId must be a valid UUID',
  }),
  supplierId: Joi.string().uuid().optional().messages({
    'string.guid': 'supplierId must be a valid UUID',
  }),
  salespersonId: Joi.string().uuid().optional().messages({
    'string.guid': 'salespersonId must be a valid UUID',
  }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

export function validateAdminOrdersQuery(
  query: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: AdminOrdersQuery } {
  const { error, value } = adminOrdersQuerySchema.validate(query, {
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
  return { value: value as AdminOrdersQuery };
}
