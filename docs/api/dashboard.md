# Dashboard API

This document covers all role-specific dashboard endpoints.

## Overview

| Endpoint | Method | Auth Required | Role Access |
|----------|--------|---------------|-------------|
| `/api/dashboard/shared` | GET | Yes | All authenticated users |
| `/api/dashboard/retailer` | GET | Yes | RETAILER only |
| `/api/dashboard/distributor` | GET | Yes | DISTRIBUTOR only |
| `/api/dashboard/stockist` | GET | Yes | STOCKIST only |
| `/api/dashboard/salesperson` | GET | Yes | SALESPERSON only |

---

## GET /api/dashboard/shared

Get shared dashboard accessible to all authenticated users.

### Use Case

- Display common information for all logged-in users
- Verify user authentication and basic info

### Request

```bash
curl http://localhost:3000/api/dashboard/shared \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "This is a shared page accessible to all authenticated users",
  "user": {
    "id": "7c376199-b402-48f3-a1c4-c31e2c5453c5",
    "loginId": "admin",
    "role": "ADMIN"
  }
}
```

---

## GET /api/dashboard/retailer

Get retailer-specific dashboard with order information.

### Use Case

- Retailer views their order history
- Track orders placed with distributors

### Request

```bash
# First, login as retailer
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "retailer1", "password": "password123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

# Access dashboard
curl http://localhost:3000/api/dashboard/retailer \
  -H "Authorization: Bearer $TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Retailer dashboard",
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "orderNumber": "ORD-001",
        "status": "PENDING",
        "totalAmount": "1500.00",
        "supplier": {
          "id": "supplier-uuid",
          "name": "Distributor Name",
          "loginId": "distributor1"
        },
        "salesperson": {
          "id": "sales-uuid",
          "name": "Sales Person",
          "loginId": "sales1"
        }
      }
    ],
    "totalOrders": 1
  }
}
```

### Error Response

**Wrong Role (403)**
```json
{
  "success": false,
  "message": "Access denied. This dashboard is only accessible to RETAILER users."
}
```

---

## GET /api/dashboard/distributor

Get distributor-specific dashboard with orders (as buyer and supplier).

### Use Case

- Distributor views orders from retailers
- Track orders placed with stockists

### Request

```bash
# First, login as distributor
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "distributor1", "password": "password123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

# Access dashboard
curl http://localhost:3000/api/dashboard/distributor \
  -H "Authorization: Bearer $TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Distributor dashboard",
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "buyer": {
          "id": "buyer-uuid",
          "name": "Retailer Name",
          "loginId": "retailer1"
        },
        "supplier": {
          "id": "supplier-uuid",
          "name": "Stockist Name",
          "loginId": "stockist1"
        }
      }
    ],
    "totalOrders": 0
  }
}
```

---

## GET /api/dashboard/stockist

Get stockist-specific dashboard with orders.

### Use Case

- Stockist views orders from distributors
- Track orders placed with admin/main stock

### Request

```bash
# First, login as stockist
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "stockist1", "password": "password123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

# Access dashboard
curl http://localhost:3000/api/dashboard/stockist \
  -H "Authorization: Bearer $TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Stockist dashboard",
  "data": {
    "orders": [],
    "totalOrders": 0
  }
}
```

---

## GET /api/dashboard/salesperson

Get salesperson-specific dashboard with their orders.

### Use Case

- Salesperson views orders they have created
- Track sales performance

### Request

```bash
# First, login as salesperson
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "salesperson1", "password": "password123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

# Access dashboard
curl http://localhost:3000/api/dashboard/salesperson \
  -H "Authorization: Bearer $TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Salesperson dashboard",
  "data": {
    "orders": [],
    "totalOrders": 0
  }
}
```

---

## Complete Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Dashboard API Tests ==="

# Test each role's dashboard
declare -A USERS
USERS["admin"]="admin123"
USERS["retailer1"]="password123"
USERS["distributor1"]="password123"
USERS["stockist1"]="password123"
USERS["salesperson1"]="password123"

declare -A DASHBOARDS
DASHBOARDS["retailer1"]="retailer"
DASHBOARDS["distributor1"]="distributor"
DASHBOARDS["stockist1"]="stockist"
DASHBOARDS["salesperson1"]="salesperson"

# Test shared dashboard with admin
echo -e "\n1. Admin accessing shared dashboard..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')
curl -s "$BASE_URL/api/dashboard/shared" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Test role-specific dashboards
for USER in retailer1 distributor1 stockist1 salesperson1; do
  PASSWORD=${USERS[$USER]}
  DASHBOARD=${DASHBOARDS[$USER]}
  
  echo -e "\n2. $USER accessing $DASHBOARD dashboard..."
  RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"loginId\": \"$USER\", \"password\": \"$PASSWORD\"}")
  TOKEN=$(echo $RESPONSE | jq -r '.data.token')
  
  curl -s "$BASE_URL/api/dashboard/$DASHBOARD" \
    -H "Authorization: Bearer $TOKEN" | jq .
done

# Test access control - retailer trying to access distributor dashboard
echo -e "\n3. Access Control Test: Retailer accessing distributor dashboard (should fail)..."
RETAILER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "retailer1", "password": "password123"}')
RETAILER_TOKEN=$(echo $RETAILER_RESPONSE | jq -r '.data.token')
curl -s "$BASE_URL/api/dashboard/distributor" \
  -H "Authorization: Bearer $RETAILER_TOKEN" | jq .

echo -e "\n=== Tests Complete ==="
```

---

## Order Flow Diagram

```
                    ┌─────────────┐
                    │    ADMIN    │
                    │ (Main Stock)│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  STOCKIST   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ DISTRIBUTOR │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  RETAILER   │
                    └─────────────┘
                           ▲
                           │
                    ┌─────────────┐
                    │ SALESPERSON │
                    │(Creates Orders)│
                    └─────────────┘
```

---

**Related Documentation:**
- [Authentication API](./authentication.md)
- [Attendance API](./attendance.md) - Salesperson time tracking
- [Main Documentation](./README.md)
