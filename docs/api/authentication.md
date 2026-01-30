# Authentication API

This document covers all authentication-related endpoints including login, user creation, and profile management.

## Overview

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| `/api/auth/login` | POST | No | Public |
| `/api/auth/me` | GET | Yes | Any authenticated user |
| `/api/auth/users` | POST | Yes | ADMIN only |

---

## POST /api/auth/login

Authenticate a user and receive a JWT token.

### Use Case

- User wants to log into the system
- Application needs to obtain an access token for API calls

### Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin",
    "password": "admin123"
  }'
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loginId` | string | Yes | Unique login identifier (3-50 chars) |
| `password` | string | Yes | User password (min 6 chars) |

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "7c376199-b402-48f3-a1c4-c31e2c5453c5",
      "loginId": "admin",
      "email": "admin@vyaapar.com",
      "name": "System Admin",
      "role": "ADMIN",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

**Invalid Credentials (401)**
```json
{
  "success": false,
  "message": "Invalid login credentials"
}
```

**Account Deactivated (403)**
```json
{
  "success": false,
  "message": "Account is deactivated"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "loginId",
      "message": "Login ID is required"
    }
  ]
}
```

---

## GET /api/auth/me

Get the current authenticated user's profile.

### Use Case

- Verify the current user's identity
- Fetch user profile information for the logged-in user
- Check if the token is still valid

### Request

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "7c376199-b402-48f3-a1c4-c31e2c5453c5",
    "loginId": "admin",
    "email": "admin@vyaapar.com",
    "name": "System Admin",
    "role": "ADMIN",
    "isActive": true
  }
}
```

### Error Responses

**No Token (401)**
```json
{
  "success": false,
  "message": "No token provided. Please login to access this resource."
}
```

**Invalid Token (401)**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Token Expired (401)**
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

## POST /api/auth/users

Create a new user account. **Admin only.**

### Use Case

- Admin wants to create a new salesperson account
- Admin wants to onboard a new retailer or distributor

### Request

```bash
curl -X POST http://localhost:3000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "loginId": "newuser1",
    "password": "securePassword123",
    "role": "SALESPERSON",
    "email": "newuser@example.com",
    "name": "New User",
    "phone": "9876543210",
    "address": "123 Main Street, City"
  }'
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loginId` | string | Yes | Unique login identifier (3-50 chars) |
| `password` | string | Yes | Password (min 6 chars) |
| `role` | string | Yes | One of: `STOCKIST`, `DISTRIBUTOR`, `RETAILER`, `SALESPERSON` |
| `email` | string | Yes | Valid email address |
| `name` | string | No | User's full name (2-100 chars) |
| `phone` | string | No | Phone number (max 20 chars) |
| `address` | string | No | Address (max 500 chars) |

### Success Response (201)

```json
{
  "success": true,
  "data": {
    "id": "d0e90bac-d0e6-4dbc-83cf-a103392665c4",
    "loginId": "newuser1",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "SALESPERSON",
    "phone": "9876543210",
    "address": "123 Main Street, City",
    "isActive": true,
    "createdAt": "2026-01-29T20:44:27.643Z",
    "updatedAt": "2026-01-29T20:44:27.643Z"
  }
}
```

### Error Responses

**Not Admin (403)**
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to access this resource."
}
```

**Duplicate Login ID (409)**
```json
{
  "success": false,
  "message": "Login ID already exists"
}
```

**Duplicate Email (409)**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**Invalid Role (400)**
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: STOCKIST, DISTRIBUTOR, RETAILER, SALESPERSON"
}
```

---

## Complete Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Authentication API Tests ==="

# Test 1: Login
echo -e "\n1. Login as admin..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}')
echo $RESPONSE | jq .

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo "Token: ${TOKEN:0:50}..."

# Test 2: Get profile
echo -e "\n2. Get current user profile..."
curl -s $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 3: Create new user
echo -e "\n3. Create a new salesperson..."
curl -s -X POST $BASE_URL/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "loginId": "testsales",
    "password": "password123",
    "role": "SALESPERSON",
    "email": "testsales@example.com",
    "name": "Test Sales"
  }' | jq .

# Test 4: Login with invalid credentials
echo -e "\n4. Login with invalid credentials (should fail)..."
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "wrongpassword"}' | jq .

echo -e "\n=== Tests Complete ==="
```

---

## JWT Token Structure

The JWT token contains the following payload:

```json
{
  "userId": "7c376199-b402-48f3-a1c4-c31e2c5453c5",
  "loginId": "admin",
  "role": "ADMIN",
  "iat": 1769719445,
  "exp": 1770324245
}
```

| Field | Description |
|-------|-------------|
| `userId` | Unique user ID (UUID) |
| `loginId` | User's login identifier |
| `role` | User's role |
| `iat` | Issued at timestamp |
| `exp` | Expiration timestamp |

The token expires in **7 days** by default (configurable via `JWT_EXPIRES_IN` env variable).

---

**Related Documentation:**
- [Users API](./users.md)
- [Dashboard API](./dashboard.md)
- [Main Documentation](./README.md)
