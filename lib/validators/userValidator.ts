import Joi from 'joi';

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

export function validateUpdateUser(
  body: unknown,
  params: { id?: string }
): { error?: { details: { path: string[]; message: string }[] }; value?: { body: { email?: string; name?: string | null }; params: { id: string } } } {
  const { error, value } = updateUserSchema.validate(
    { body, params },
    { abortEarly: false, stripUnknown: true }
  );
  if (error) {
    return {
      error: {
        details: error.details.map((d) => ({ path: d.path as string[], message: d.message })),
      },
    };
  }
  return { value: value as { body: { email?: string; name?: string | null }; params: { id: string } } };
}
