import Joi from 'joi';

export interface RetailerOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateRetailerOrderBody {
  supplierId: string;
  items: RetailerOrderItem[];
  notes?: string;
}

const createRetailerOrderSchema = Joi.object({
  supplierId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid supplier ID format',
    'any.required': 'supplierId is required',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required().messages({
          'string.guid': 'Invalid product ID format',
          'any.required': 'productId is required for each item',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'Quantity must be at least 1',
          'any.required': 'quantity is required for each item',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'items is required',
    }),
  notes: Joi.string().allow('').optional().max(2000).messages({
    'string.max': 'Notes cannot exceed 2000 characters',
  }),
});

export function validateCreateRetailerOrder(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: CreateRetailerOrderBody } {
  const { error, value } = createRetailerOrderSchema.validate(body, {
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
  return { value: value as CreateRetailerOrderBody };
}
