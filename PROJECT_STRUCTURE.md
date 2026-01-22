# Project Structure

This document describes the folder structure and architecture of the Vyaapar backend project.

## Directory Structure

```
vyaapar-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Prisma client configuration
│   │   └── env.js        # Environment variables validation
│   ├── controllers/      # Request handlers (route handlers)
│   │   └── userController.js
│   ├── routes/           # Route definitions
│   │   ├── index.js      # Main router that combines all routes
│   │   └── userRoutes.js # User-specific routes
│   ├── services/         # Business logic layer
│   │   └── userService.js
│   ├── middleware/       # Custom middleware
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── validation.js      # Validation middleware factory
│   │   ├── asyncHandler.js    # Async error wrapper
│   │   └── logger.js          # Request logging middleware
│   ├── validators/       # Input validation schemas
│   │   └── userValidator.js
│   ├── errors/           # Custom error classes
│   │   └── AppError.js
│   ├── utils/            # Utility functions
│   │   ├── logger.js     # Logging utility
│   │   └── helpers.js    # Helper functions
│   └── index.js          # Application entry point
├── prisma/
│   └── schema.prisma     # Prisma schema definition
└── package.json
```

## Architecture Layers

### 1. Routes (`src/routes/`)
- Define API endpoints and HTTP methods
- Connect routes to controllers
- Apply validation middleware
- Example: `router.get('/users', getAllUsers)`

### 2. Controllers (`src/controllers/`)
- Handle HTTP requests and responses
- Extract data from requests
- Call services for business logic
- Return formatted responses
- Should be thin - minimal business logic

### 3. Services (`src/services/`)
- Contain business logic
- Interact with database through Prisma
- Handle data transformations
- Reusable across different controllers
- Can call other services

### 4. Validators (`src/validators/`)
- Define validation schemas using Joi
- Validate request data (body, params, query)
- Return formatted error messages

### 5. Middleware (`src/middleware/`)
- **errorHandler**: Global error handling
- **validation**: Generic validation middleware factory
- **asyncHandler**: Wrapper for async route handlers
- **logger**: Request logging middleware

### 6. Errors (`src/errors/`)
- Custom error classes
- Extend base Error class
- Include status codes and operational flags

### 7. Utils (`src/utils/`)
- Reusable utility functions
- Logger implementation
- Helper functions (pagination, formatting, etc.)

### 8. Config (`src/config/`)
- Database configuration
- Environment variable validation
- Application configuration

## Data Flow

```
Request → Routes → Validation → Controller → Service → Database (Prisma)
                                                      ↓
Response ← Routes ← Controller ← Service ← Database
```

## Best Practices

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Error Handling**: Use try-catch in controllers, throw errors in services
3. **Validation**: Always validate input data before processing
4. **Service Layer**: Keep business logic in services, not controllers
5. **Consistent Responses**: Use standardized response format
6. **Error Middleware**: Handle all errors in centralized error handler

## Adding New Features

When adding a new feature (e.g., Products):

1. **Update Prisma Schema**: Add model in `prisma/schema.prisma`
2. **Create Service**: `src/services/productService.js`
3. **Create Controller**: `src/controllers/productController.js`
4. **Create Validator**: `src/validators/productValidator.js`
5. **Create Routes**: `src/routes/productRoutes.js`
6. **Register Routes**: Add to `src/routes/index.js`

## Example: Creating a New Resource

### 1. Prisma Schema
```prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Service (`src/services/productService.js`)
```javascript
import prisma from '../config/database.js';
import { AppError } from '../errors/AppError.js';

class ProductService {
  async getAllProducts() {
    return prisma.product.findMany();
  }
  
  async createProduct(data) {
    return prisma.product.create({ data });
  }
}

export default new ProductService();
```

### 3. Controller (`src/controllers/productController.js`)
```javascript
import productService from '../services/productService.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
```

### 4. Validator (`src/validators/productValidator.js`)
```javascript
import Joi from 'joi';

const createProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
  }),
});

export const validateCreateProduct = (req, res, next) => {
  // Validation logic
};
```

### 5. Routes (`src/routes/productRoutes.js`)
```javascript
import express from 'express';
import { getAllProducts } from '../controllers/productController.js';
import { validateCreateProduct } from '../validators/productValidator.js';

const router = express.Router();
router.get('/', getAllProducts);
router.post('/', validateCreateProduct, createProduct);

export default router;
```

### 6. Register in `src/routes/index.js`
```javascript
import productRoutes from './productRoutes.js';
router.use('/products', productRoutes);
```
