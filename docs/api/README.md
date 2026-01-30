# Vyaapar Backend API Documentation

Welcome to the Vyaapar Backend API documentation. This guide provides comprehensive information about all available API endpoints, their use cases, and examples.

## Base URL

```
Development: http://localhost:3000
Production: https://your-production-url.com
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Categories

| Category | Description | Documentation |
|----------|-------------|---------------|
| [Authentication](./authentication.md) | Login, user creation, profile management | [View Docs](./authentication.md) |
| [Users](./users.md) | User CRUD operations | [View Docs](./users.md) |
| [Dashboard](./dashboard.md) | Role-specific dashboards | [View Docs](./dashboard.md) |
| [Attendance](./attendance.md) | Salesperson time tracking | [View Docs](./attendance.md) |
| [Cart](./cart.md) | Shopping cart and order creation | [View Docs](./cart.md) |
| [Health](./health.md) | Server health checks | [View Docs](./health.md) |

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `ADMIN` | System administrator | Full access to all endpoints |
| `DEVELOPER` | Developer access | Same as ADMIN |
| `STOCKIST` | Stock manager | Stockist dashboard, orders |
| `DISTRIBUTOR` | Product distributor | Distributor dashboard, orders |
| `RETAILER` | Retail seller | Retailer dashboard, orders |
| `SALESPERSON` | Sales representative | Salesperson dashboard, attendance tracking, cart & orders |

## Quick Start

### 1. Check Server Health

```bash
curl http://localhost:3000/api/health
```

### 2. Login as Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin", "password": "admin123"}'
```

### 3. Use the Token

```bash
# Save token to environment variable
export TOKEN="your_jwt_token_here"

# Use in requests
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Response Format

All API responses follow this standard format:

### Success Response

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Validation error |
| `401` | Unauthorized - Invalid/missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found |
| `409` | Conflict - Duplicate entry |
| `500` | Internal Server Error |

## Testing the API

### Using cURL

All examples in this documentation use cURL. Make sure you have it installed:

```bash
# Check if cURL is installed
curl --version
```

### Using Postman

1. Import the base URL: `http://localhost:3000`
2. Set up environment variable for `TOKEN`
3. Add Authorization header: `Bearer {{TOKEN}}`

### Using HTTPie

```bash
# Install HTTPie
pip install httpie

# Example request
http POST localhost:3000/api/auth/login loginId=admin password=admin123
```

## Default Test Users

| Login ID | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `retailer1` | `password123` | RETAILER |
| `distributor1` | `password123` | DISTRIBUTOR |
| `stockist1` | `password123` | STOCKIST |
| `salesperson1` | `password123` | SALESPERSON |

## Rate Limiting

Currently, there is no rate limiting implemented. For production, consider adding rate limiting middleware.

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-29 | Initial API release |
| 1.1.0 | 2026-01-29 | Added Attendance tracking feature |
| 1.2.0 | 2026-01-30 | Added Cart and order creation for salespersons |
| 1.3.0 | 2026-01-30 | Added GET /api/orders/:id to view single order (Admin or salesperson) |

---

For more detailed information, refer to the individual documentation files linked above.
