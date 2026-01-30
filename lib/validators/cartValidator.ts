import Joi from 'joi';

const addItemSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid product ID format',
    'any.required': 'productId is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'quantity is required',
  }),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'quantity is required',
  }),
});

const setBuyerSchema = Joi.object({
  buyerId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid buyer ID format',
    'any.required': 'buyerId is required',
  }),
});

const setSupplierSchema = Joi.object({
  supplierId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid supplier ID format',
    'any.required': 'supplierId is required',
  }),
});

const checkoutSchema = Joi.object({
  notes: Joi.string().allow('').optional().max(2000).messages({
    'string.max': 'Notes cannot exceed 2000 characters',
  }),
});

export interface AddCartItemBody {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export interface SetBuyerBody {
  buyerId: string;
}

export interface SetSupplierBody {
  supplierId: string;
}

export interface CheckoutBody {
  notes?: string;
}

export function validateAddCartItem(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: AddCartItemBody } {
  const { error, value } = addItemSchema.validate(body, {
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
  return { value: value as AddCartItemBody };
}

export function validateUpdateCartItem(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: UpdateCartItemBody } {
  const { error, value } = updateItemSchema.validate(body, {
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
  return { value: value as UpdateCartItemBody };
}

export function validateSetBuyer(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: SetBuyerBody } {
  const { error, value } = setBuyerSchema.validate(body, {
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
  return { value: value as SetBuyerBody };
}

export function validateSetSupplier(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: SetSupplierBody } {
  const { error, value } = setSupplierSchema.validate(body, {
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
  return { value: value as SetSupplierBody };
}

export function validateCheckout(
  body: unknown
): { error?: { details: { path: string[]; message: string }[] }; value?: CheckoutBody } {
  const { error, value } = checkoutSchema.validate(body ?? {}, {
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
  return { value: value as CheckoutBody };
}
