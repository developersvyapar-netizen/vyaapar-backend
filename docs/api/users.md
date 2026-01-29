# Users API

This document covers all user management endpoints for CRUD operations on user accounts.

## Overview

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/users` | GET | Yes | List all users |
| `/api/users/:id` | GET | Yes | Get user by ID |
| `/api/users/:id` | PUT | Yes | Update user |
| `/api/users/:id` | DELETE | Yes | Delete user |

---

## GET /api/users

Get a list of all users.

### Use Case

- Admin needs to view all registered users
- Display user list in admin dashboard

### Request

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "7c376199-b402-48f3-a1c4-c31e2c5453c5",
      "email": "admin@vyaapar.com",
      "name": "System Admin",
      "createdAt": "2026-01-29T20:39:31.778Z",
      "updatedAt": "2026-01-29T20:39:31.778Z"
    },
    {
      "id": "d0e90bac-d0e6-4dbc-83cf-a103392665c4",
      "email": "retailer1@example.com",
      "name": "Test Retailer",
      "createdAt": "2026-01-29T20:44:27.643Z",
      "updatedAt": "2026-01-29T20:44:27.643Z"
    }
  ]
}
```

---

## GET /api/users/:id

Get a specific user by their ID.

### Use Case

- View detailed information about a specific user
- Verify user exists before performing operations

### Request

```bash
curl http://localhost:3000/api/users/d0e90bac-d0e6-4dbc-83cf-a103392665c4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User's unique identifier |

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d0e90bac-d0e6-4dbc-83cf-a103392665c4",
    "email": "retailer1@example.com",
    "name": "Test Retailer",
    "createdAt": "2026-01-29T20:44:27.643Z",
    "updatedAt": "2026-01-29T20:44:27.643Z"
  }
}
```

### Error Response

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## PUT /api/users/:id

Update an existing user's information.

### Use Case

- Update user's email address
- Change user's display name
- Correct user information

### Request

```bash
curl -X PUT http://localhost:3000/api/users/d0e90bac-d0e6-4dbc-83cf-a103392665c4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newemail@example.com",
    "name": "Updated Name"
  }'
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User's unique identifier |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | New email address |
| `name` | string | No | New display name (can be null to clear) |

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d0e90bac-d0e6-4dbc-83cf-a103392665c4",
    "email": "newemail@example.com",
    "name": "Updated Name",
    "createdAt": "2026-01-29T20:44:27.643Z",
    "updatedAt": "2026-01-29T20:45:25.723Z"
  }
}
```

### Error Responses

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Email Already Exists (409)**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

## DELETE /api/users/:id

Delete a user account.

### Use Case

- Remove inactive user accounts
- Delete test accounts
- Remove users who are no longer part of the organization

### Request

```bash
curl -X DELETE http://localhost:3000/api/users/d0e90bac-d0e6-4dbc-83cf-a103392665c4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User's unique identifier |

### Success Response (200)

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Error Response

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Complete Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# Login first to get token
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

echo "=== Users API Tests ==="

# Test 1: List all users
echo -e "\n1. List all users..."
curl -s "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 2: Get specific user
echo -e "\n2. Get user by ID..."
USER_ID=$(curl -s "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[1].id')
curl -s "$BASE_URL/api/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 3: Update user
echo -e "\n3. Update user..."
curl -s -X PUT "$BASE_URL/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Updated via API"}' | jq .

# Test 4: Create a user to delete
echo -e "\n4. Create user for deletion test..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "loginId": "todelete",
    "password": "password123",
    "role": "RETAILER",
    "email": "todelete@example.com"
  }')
DELETE_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo $CREATE_RESPONSE | jq .

# Test 5: Delete user
echo -e "\n5. Delete user..."
curl -s -X DELETE "$BASE_URL/api/users/$DELETE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 6: Verify deletion
echo -e "\n6. Verify user deleted (should return 404)..."
curl -s "$BASE_URL/api/users/$DELETE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== Tests Complete ==="
```

---

**Related Documentation:**
- [Authentication API](./authentication.md)
- [Main Documentation](./README.md)
