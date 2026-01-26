import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Login validation schema
const loginSchema = Joi.object({
  body: Joi.object({
    loginId: Joi.string().min(3).max(50).required().messages({
      'string.min': 'Login ID must be at least 3 characters long',
      'string.max': 'Login ID must not exceed 50 characters',
      'any.required': 'Login ID is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }).required(),
});

// Create user validation schema (admin only)
const createUserSchema = Joi.object({
  body: Joi.object({
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
  }).required(),
});

// Validation middleware
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = loginSchema.validate(
    {
      body: req.body,
    },
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  req.body = value.body;
  next();
};

export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = createUserSchema.validate(
    {
      body: req.body,
    },
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  req.body = value.body;
  next();
};
