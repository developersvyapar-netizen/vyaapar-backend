import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const createUserSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    name: Joi.string().min(2).max(100).optional().allow(null).messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
    }),
  }).required(),
});

const updateUserSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().optional().messages({
      'string.email': 'Please provide a valid email address',
    }),
    name: Joi.string().min(2).max(100).optional().allow(null).messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
    }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
  }).required(),
});

// Validation middleware
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

export const validateUpdateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = updateUserSchema.validate(
    {
      body: req.body,
      params: req.params,
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
  req.params = value.params;
  next();
};
