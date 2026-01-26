# Authentication & Authorization System

This document describes the authentication and role-based access control (RBAC) system implemented in the Vyaapar backend.

## Features

1. **User Authentication**
   - Users authenticate using `loginId` and `password`
   - Passwords are hashed using bcrypt (never stored in plain text)
   - JWT token-based authentication with configurable expiration
   - Session persists across page refreshes via token storage

2. **Admin User Creation**
   - Only ADMIN and DEVELOPER roles can create new users
   - Admin can create users with roles: STOCKIST, DISTRIBUTOR, RETAILER, SALESPERSON
   - Each user gets a unique `loginId` for authentication

3. **Role-Based Access Control**
   - Each role has access to its own dashboard:
     - `/api/dashboard/stockist` - STOCKIST only
     - `/api/dashboard/distributor` - DISTRIBUTOR only
     - `/api/dashboard/retailer` - RETAILER only
     - `/api/dashboard/salesperson` - SALESPERSON only
   - Shared pages accessible to all authenticated users:
     - `/api/dashboard/shared` - All authenticated users

4. **Security Features**
   - Unauthorized access returns safe error messages (no data leakage)
   - Token expiration handling
   - Password hashing with salt rounds
   - Protected routes require valid JWT token

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with loginId and password.

**Request Body:**
```json
{
  "loginId": "user123",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "loginId": "user123",
      "email": "user@example.com",
      "name": "User Name",
      "role": "RETAILER",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loginId": "user123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "RETAILER",
    "isActive": true
  }
}
```

#### POST `/api/auth/users` (Admin Only)
Create a new user. Requires ADMIN or DEVELOPER role.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "loginId": "newuser123",
  "password": "securepassword",
  "role": "RETAILER",
  "email": "newuser@example.com",
  "name": "New User",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loginId": "newuser123",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "RETAILER",
    "phone": "+1234567890",
    "address": "123 Main St",
    "isActive": true,
    "createdAt": "2026-01-25T...",
    "updatedAt": "2026-01-25T..."
  }
}
```

### Dashboards

#### GET `/api/dashboard/shared`
Shared page accessible to all authenticated users.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/dashboard/stockist`
Stockist dashboard - only accessible to STOCKIST role.

**Headers:**
```
Authorization: Bearer <stockist_token>
```

#### GET `/api/dashboard/distributor`
Distributor dashboard - only accessible to DISTRIBUTOR role.

**Headers:**
```
Authorization: Bearer <distributor_token>
```

#### GET `/api/dashboard/retailer`
Retailer dashboard - only accessible to RETAILER role.

**Headers:**
```
Authorization: Bearer <retailer_token>
```

#### GET `/api/dashboard/salesperson`
Salesperson dashboard - only accessible to SALESPERSON role.

**Headers:**
```
Authorization: Bearer <salesperson_token>
```

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## Usage in Frontend

### 1. Login and Store Token

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ loginId: 'user123', password: 'password123' })
});

const { data } = await response.json();
const { token, user } = data;

// Store token (e.g., in localStorage or httpOnly cookie)
localStorage.setItem('token', token);
```

### 2. Make Authenticated Requests

```javascript
// Include token in Authorization header
const token = localStorage.getItem('token');

const response = await fetch('/api/dashboard/retailer', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Handle Token Expiration

```javascript
// If you get 401, redirect to login
if (response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

## Database Migration

After updating the schema, run:

```bash
npm run prisma:migrate
# or
npm run prisma:push
```

This will update the database to include the `loginId` field.

## Security Notes

1. **Password Security**: Passwords are hashed with bcrypt (10 salt rounds) and never stored in plain text.

2. **Token Security**: 
   - Tokens are signed with JWT_SECRET
   - Store tokens securely (consider httpOnly cookies for production)
   - Tokens expire after the configured time (default: 7 days)

3. **Error Messages**: 
   - Authentication errors return generic messages to prevent user enumeration
   - No sensitive data is leaked in error responses

4. **Role Validation**: 
   - Role-based access is enforced at the middleware level
   - Users can only access dashboards for their role
   - Admin-only endpoints require ADMIN or DEVELOPER role

## Middleware

### `authenticate`
Verifies JWT token and attaches user info to request.

### `requireRole(...roles)`
Ensures user has one of the specified roles.

### `requireAdmin`
Shorthand for `requireRole('ADMIN', 'DEVELOPER')`.

### `requireRoleDashboard(role)`
Ensures user can only access dashboard for their specific role.

## Creating the First Admin User

You'll need to create the first admin user manually in the database or via a seed script. Here's an example:

```typescript
import bcrypt from 'bcrypt';
import prisma from './config/database.js';

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      loginId: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
};
```
