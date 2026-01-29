# Attendance API

This document covers all salesperson attendance tracking endpoints for daily login/logout time management.

## Overview

The Attendance system allows:
- **Salespersons** to log their daily work hours (login/logout times)
- **Admins** to monitor and track all salespersons' attendance

### Endpoint Summary

| Endpoint | Method | Auth Required | Role Access |
|----------|--------|---------------|-------------|
| `/api/attendance/login` | POST | Yes | SALESPERSON |
| `/api/attendance/login` | GET | Yes | SALESPERSON |
| `/api/attendance/logout` | POST | Yes | SALESPERSON |
| `/api/attendance/my-history` | GET | Yes | SALESPERSON |
| `/api/attendance/all` | GET | Yes | ADMIN |
| `/api/attendance/salesperson/:id` | GET | Yes | ADMIN |
| `/api/attendance/report` | GET | Yes | ADMIN |

### Attendance Status Types

| Status | Description |
|--------|-------------|
| `LOGGED_IN` | User has logged in but not logged out |
| `LOGGED_OUT` | User has completed their work day (logged in and out) |
| `INCOMPLETE` | Session marked as incomplete (for edge cases) |

---

## Salesperson Endpoints

### POST /api/attendance/login

Record daily login time. Can only be done once per day.

#### Use Case

- Salesperson starts their work day
- Record the time they begin working

#### Request

```bash
curl -X POST http://localhost:3000/api/attendance/login \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Login time recorded successfully",
  "data": {
    "id": "e3678124-f18e-4582-8c82-382325d69dd6",
    "loginTime": "2026-01-29T20:53:10.542Z",
    "date": "2026-01-29T00:00:00.000Z",
    "status": "LOGGED_IN",
    "salesperson": {
      "id": "d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1",
      "name": "Test Salesperson",
      "loginId": "salesperson1",
      "email": "salesperson1@example.com"
    }
  }
}
```

#### Error Responses

**Already Logged In Today (400)**
```json
{
  "success": false,
  "message": "You have already logged in today"
}
```

**Not a Salesperson (403)**
```json
{
  "success": false,
  "message": "Only salespersons can record attendance"
}
```

---

### GET /api/attendance/login

Check today's attendance status.

#### Use Case

- Check if already logged in for the day
- View current status before taking action

#### Request

```bash
curl http://localhost:3000/api/attendance/login \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response - Not Logged In (200)

```json
{
  "success": true,
  "data": {
    "hasLoggedIn": false,
    "hasLoggedOut": false,
    "status": null,
    "loginTime": null,
    "logoutTime": null
  }
}
```

#### Success Response - Logged In (200)

```json
{
  "success": true,
  "data": {
    "hasLoggedIn": true,
    "hasLoggedOut": false,
    "status": "LOGGED_IN",
    "loginTime": "2026-01-29T20:53:10.542Z",
    "logoutTime": null,
    "totalHours": null
  }
}
```

#### Success Response - Logged Out (200)

```json
{
  "success": true,
  "data": {
    "hasLoggedIn": true,
    "hasLoggedOut": true,
    "status": "LOGGED_OUT",
    "loginTime": "2026-01-29T09:00:00.000Z",
    "logoutTime": "2026-01-29T18:00:00.000Z",
    "totalHours": "9.00"
  }
}
```

---

### POST /api/attendance/logout

Record daily logout time. Must have logged in first.

#### Use Case

- Salesperson ends their work day
- Record the time they stop working

#### Request

```bash
curl -X POST http://localhost:3000/api/attendance/logout \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Logout time recorded successfully",
  "data": {
    "id": "e3678124-f18e-4582-8c82-382325d69dd6",
    "loginTime": "2026-01-29T09:00:00.000Z",
    "logoutTime": "2026-01-29T18:00:00.000Z",
    "date": "2026-01-29T00:00:00.000Z",
    "totalHours": "9.00",
    "status": "LOGGED_OUT",
    "salesperson": {
      "id": "d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1",
      "name": "Test Salesperson",
      "loginId": "salesperson1",
      "email": "salesperson1@example.com"
    }
  }
}
```

#### Error Responses

**Not Logged In Today (400)**
```json
{
  "success": false,
  "message": "You have not logged in today. Please login first."
}
```

**Already Logged Out (400)**
```json
{
  "success": false,
  "message": "You have already logged out today"
}
```

---

### GET /api/attendance/my-history

Get salesperson's own attendance history with pagination.

#### Use Case

- View past attendance records
- Check work hours over time
- Review attendance patterns

#### Request

```bash
# Basic request
curl "http://localhost:3000/api/attendance/my-history" \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"

# With date filters
curl "http://localhost:3000/api/attendance/my-history?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"

# With pagination
curl "http://localhost:3000/api/attendance/my-history?page=1&limit=10" \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO Date | No | - | Filter from date (YYYY-MM-DD) |
| `endDate` | ISO Date | No | - | Filter to date (YYYY-MM-DD) |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max 100) |

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "e3678124-f18e-4582-8c82-382325d69dd6",
        "loginTime": "2026-01-29T09:00:00.000Z",
        "logoutTime": "2026-01-29T18:00:00.000Z",
        "date": "2026-01-29T00:00:00.000Z",
        "totalHours": "9.00",
        "status": "LOGGED_OUT",
        "createdAt": "2026-01-29T09:00:00.901Z"
      },
      {
        "id": "abc123...",
        "loginTime": "2026-01-28T08:30:00.000Z",
        "logoutTime": "2026-01-28T17:30:00.000Z",
        "date": "2026-01-28T00:00:00.000Z",
        "totalHours": "9.00",
        "status": "LOGGED_OUT",
        "createdAt": "2026-01-28T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

## Admin Endpoints

### GET /api/attendance/all

Get all salespersons' attendance records.

#### Use Case

- Admin views all attendance records
- Monitor overall team attendance

#### Request

```bash
# Basic request
curl "http://localhost:3000/api/attendance/all" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Filter by salesperson
curl "http://localhost:3000/api/attendance/all?salespersonId=d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Filter by specific date
curl "http://localhost:3000/api/attendance/all?date=2026-01-29" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Filter by date range
curl "http://localhost:3000/api/attendance/all?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `salespersonId` | UUID | No | - | Filter by specific salesperson |
| `date` | ISO Date | No | - | Filter by specific date (YYYY-MM-DD) |
| `startDate` | ISO Date | No | - | Filter from date |
| `endDate` | ISO Date | No | - | Filter to date |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max 100) |

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "e3678124-f18e-4582-8c82-382325d69dd6",
        "loginTime": "2026-01-29T09:00:00.000Z",
        "logoutTime": "2026-01-29T18:00:00.000Z",
        "date": "2026-01-29T00:00:00.000Z",
        "totalHours": "9.00",
        "status": "LOGGED_OUT",
        "salesperson": {
          "id": "d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1",
          "name": "Test Salesperson",
          "loginId": "salesperson1",
          "email": "salesperson1@example.com",
          "phone": "9876543210"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/attendance/salesperson/:salespersonId

Get attendance records for a specific salesperson.

#### Use Case

- Admin reviews individual salesperson's attendance
- Performance review preparation

#### Request

```bash
curl "http://localhost:3000/api/attendance/salesperson/d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# With date filters
curl "http://localhost:3000/api/attendance/salesperson/d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `salespersonId` | UUID | Salesperson's unique identifier |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO Date | No | - | Filter from date |
| `endDate` | ISO Date | No | - | Filter to date |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "salesperson": {
      "id": "d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1",
      "name": "Test Salesperson",
      "loginId": "salesperson1",
      "email": "salesperson1@example.com"
    },
    "logs": [
      {
        "id": "e3678124-f18e-4582-8c82-382325d69dd6",
        "loginTime": "2026-01-29T09:00:00.000Z",
        "logoutTime": "2026-01-29T18:00:00.000Z",
        "date": "2026-01-29T00:00:00.000Z",
        "totalHours": "9.00",
        "status": "LOGGED_OUT",
        "createdAt": "2026-01-29T09:00:00.901Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Error Responses

**Salesperson Not Found (404)**
```json
{
  "success": false,
  "message": "Salesperson not found"
}
```

**User Is Not a Salesperson (400)**
```json
{
  "success": false,
  "message": "User is not a salesperson"
}
```

---

### GET /api/attendance/report

Get attendance report with summary statistics.

#### Use Case

- Generate attendance reports
- View summary statistics for HR/management
- Analyze work hour patterns

#### Request

```bash
# Full report
curl "http://localhost:3000/api/attendance/report" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Report for specific salesperson
curl "http://localhost:3000/api/attendance/report?salespersonId=d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Monthly report
curl "http://localhost:3000/api/attendance/report?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Daily report
curl "http://localhost:3000/api/attendance/report?date=2026-01-29" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `salespersonId` | UUID | No | - | Filter by specific salesperson |
| `date` | ISO Date | No | - | Filter by specific date |
| `startDate` | ISO Date | No | - | Filter from date |
| `endDate` | ISO Date | No | - | Filter to date |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 25,
      "loggedIn": 3,
      "loggedOut": 20,
      "incomplete": 2,
      "totalHoursWorked": 180.5,
      "averageHoursPerSession": 9.03
    },
    "logs": [
      {
        "id": "e3678124-f18e-4582-8c82-382325d69dd6",
        "loginTime": "2026-01-29T09:00:00.000Z",
        "logoutTime": "2026-01-29T18:00:00.000Z",
        "date": "2026-01-29T00:00:00.000Z",
        "totalHours": "9.00",
        "status": "LOGGED_OUT",
        "salesperson": {
          "id": "d19e0d0b-ab3e-41fb-bb63-fe6d46eafac1",
          "name": "Test Salesperson",
          "loginId": "salesperson1",
          "email": "salesperson1@example.com",
          "phone": "9876543210"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

---

## Complete Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "============================================"
echo "      ATTENDANCE API COMPLETE TEST SUITE"
echo "============================================"

# Get Admin Token
echo -e "\n📌 Getting Admin Token..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')
echo "Admin token obtained: ${ADMIN_TOKEN:0:30}..."

# Get Salesperson Token
echo -e "\n📌 Getting Salesperson Token..."
SALES_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "salesperson1", "password": "password123"}')
SALES_TOKEN=$(echo $SALES_RESPONSE | jq -r '.data.token')
SALES_ID=$(echo $SALES_RESPONSE | jq -r '.data.user.id')
echo "Salesperson ID: $SALES_ID"

echo -e "\n============================================"
echo "          SALESPERSON TESTS"
echo "============================================"

# Test 1: Check today's status
echo -e "\n1️⃣ Check today's attendance status..."
curl -s "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 2: Record login
echo -e "\n2️⃣ Record login time..."
curl -s -X POST "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 3: Try duplicate login (should fail)
echo -e "\n3️⃣ Try duplicate login (should fail)..."
curl -s -X POST "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 4: Check status after login
echo -e "\n4️⃣ Check status after login..."
curl -s "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 5: Record logout
echo -e "\n5️⃣ Record logout time..."
curl -s -X POST "$BASE_URL/api/attendance/logout" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 6: Try duplicate logout (should fail)
echo -e "\n6️⃣ Try duplicate logout (should fail)..."
curl -s -X POST "$BASE_URL/api/attendance/logout" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 7: View my history
echo -e "\n7️⃣ View attendance history..."
curl -s "$BASE_URL/api/attendance/my-history" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

# Test 8: View history with date filter
echo -e "\n8️⃣ View history with date filter..."
curl -s "$BASE_URL/api/attendance/my-history?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

echo -e "\n============================================"
echo "              ADMIN TESTS"
echo "============================================"

# Test 9: Get all attendance
echo -e "\n9️⃣ Get all attendance records..."
curl -s "$BASE_URL/api/attendance/all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Test 10: Get specific salesperson attendance
echo -e "\n🔟 Get specific salesperson attendance..."
curl -s "$BASE_URL/api/attendance/salesperson/$SALES_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Test 11: Get attendance report
echo -e "\n1️⃣1️⃣ Get attendance report with summary..."
curl -s "$BASE_URL/api/attendance/report" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Test 12: Filter by date
echo -e "\n1️⃣2️⃣ Filter by today's date..."
TODAY=$(date +%Y-%m-%d)
curl -s "$BASE_URL/api/attendance/report?date=$TODAY" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo -e "\n============================================"
echo "          ACCESS CONTROL TESTS"
echo "============================================"

# Test 13: Retailer trying to use attendance (should fail)
echo -e "\n1️⃣3️⃣ Retailer trying to record attendance (should fail)..."
RETAILER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "retailer1", "password": "password123"}')
RETAILER_TOKEN=$(echo $RETAILER_RESPONSE | jq -r '.data.token')
curl -s -X POST "$BASE_URL/api/attendance/login" \
  -H "Authorization: Bearer $RETAILER_TOKEN" | jq .

# Test 14: Salesperson trying to access admin endpoint (should fail)
echo -e "\n1️⃣4️⃣ Salesperson trying admin endpoint (should fail)..."
curl -s "$BASE_URL/api/attendance/all" \
  -H "Authorization: Bearer $SALES_TOKEN" | jq .

echo -e "\n============================================"
echo "          ✅ ALL TESTS COMPLETE"
echo "============================================"
```

Save this script as `test-attendance.sh` and run:

```bash
chmod +x test-attendance.sh
./test-attendance.sh
```

---

## Database Schema

```prisma
model AttendanceLog {
  id            String           @id @default(uuid())
  
  salespersonId String
  salesperson   User             @relation("SalespersonAttendance", fields: [salespersonId], references: [id])
  
  loginTime     DateTime
  logoutTime    DateTime?
  date          DateTime         @db.Date
  totalHours    Decimal?         @db.Decimal(5, 2)
  status        AttendanceStatus @default(LOGGED_IN)
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([salespersonId, date])
  @@map("attendance_logs")
  @@index([salespersonId])
  @@index([date])
  @@index([status])
}

enum AttendanceStatus {
  LOGGED_IN
  LOGGED_OUT
  INCOMPLETE
}
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SALESPERSON WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Start of Day                              End of Day       │
│        │                                         │           │
│        ▼                                         ▼           │
│   ┌─────────┐                              ┌─────────┐       │
│   │ GET     │  Check if                    │ POST    │       │
│   │ /login  │  already                     │ /logout │       │
│   └────┬────┘  logged in                   └────┬────┘       │
│        │                                        │            │
│        ▼                                        ▼            │
│   ┌─────────┐                              ┌─────────┐       │
│   │ POST    │  Record                      │ Hours   │       │
│   │ /login  │  login time                  │ Calc'd  │       │
│   └────┬────┘                              └────┬────┘       │
│        │                                        │            │
│        ▼                                        ▼            │
│   Status: LOGGED_IN                    Status: LOGGED_OUT    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      ADMIN WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐│
│   │ GET /all     │     │ GET          │     │ GET /report  ││
│   │              │     │ /salesperson │     │              ││
│   │ View all     │     │ /:id         │     │ Summary +    ││
│   │ attendance   │     │              │     │ Statistics   ││
│   └──────────────┘     │ Individual   │     └──────────────┘│
│                        │ history      │                      │
│                        └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Related Documentation:**
- [Authentication API](./authentication.md) - Login to get tokens
- [Dashboard API](./dashboard.md) - Salesperson dashboard
- [Main Documentation](./README.md)
