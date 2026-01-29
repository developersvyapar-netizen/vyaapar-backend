import Joi from 'joi';

const loginSchema = Joi.object({
  loginId: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Login ID must be at least 3 characters long',
    'string.max': 'Login ID must not exceed 50 characters',
    'any.required': 'Login ID is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

const createUserSchema = Joi.object({
  loginId: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Login ID must be at least 3 characters long',
    'string.max': 'Login ID must not exceed 50 characters',
    'any.required': 'Login ID is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string()
    .valid('STOCKIST', 'DISTRIBUTOR', 'RETAILER', 'SALESPERSON')
    .required()
    .messages({
      'any.only': 'Role must be one of: STOCKIST, DISTRIBUTOR, RETAILER, SALESPERSON',
      'any.required': 'Role is required',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  name: Joi.string().min(2).max(100).optional().allow(null, '').messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
  phone: Joi.string().max(20).optional().allow(null, '').messages({
    'string.max': 'Phone must not exceed 20 characters',
  }),
  address: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Address must not exceed 500 characters',
  }),
});

export function validateLogin(body: unknown): { error?: { details: { path: string[]; message: string }[] }; value?: { loginId: string; password: string } } {
  const { error, value } = loginSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return {
      error: {
        details: error.details.map((d) => ({ path: d.path as string[], message: d.message })),
      },
    };
  }
  return { value: value as { loginId: string; password: string } };
}

export function validateCreateUser(body: unknown): { error?: { details: { path: string[]; message: string }[] }; value?: Record<string, unknown> } {
  const { error, value } = createUserSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return {
      error: {
        details: error.details.map((d) => ({ path: d.path as string[], message: d.message })),
      },
    };
  }
  return { value: value as Record<string, unknown> };
}
