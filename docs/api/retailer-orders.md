# Retailer Direct Orders API

This document covers the direct ordering feature for retailers. Retailers can create orders themselves without needing a salesperson — they simply select a distributor, add items, and place the order in a single request.

## Overview

- **No cart needed** — the retailer submits the full order in one API call.
- **Buyer is automatic** — the logged-in retailer is always the buyer.
- **Supplier must be a DISTRIBUTOR** — retailers can only order from distributors.
- **No salesperson required** — `salespersonId` is `null` on self-orders.
- **Order number format** is the same as salesperson orders: `ORD-YYYYMMDD-XXXXX`.

### Endpoint Summary

| Endpoint | Method | Auth Required | Role Access |
|----------|--------|---------------|-------------|
| `/api/retailer/orders` | POST | Yes | RETAILER |

---

## Create Order

### POST /api/retailer/orders

Place an order directly as a retailer. The logged-in retailer is automatically set as the buyer. No cart or salesperson is involved.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| supplierId | string (UUID) | Yes | User ID of the distributor to order from |
| items | array | Yes | Array of order items (min 1 item) |
| items[].productId | string (UUID) | Yes | Product ID |
| items[].quantity | number (integer >= 1) | Yes | Quantity to order |
| notes | string | No | Optional order notes (max 2000 chars) |

#### Request

```bash
curl -X POST http://localhost:3000/api/retailer/orders \
  -H "Authorization: Bearer RETAILER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "distributor-user-uuid",
    "items": [
      { "productId": "product-uuid-1", "quantity": 5 },
      { "productId": "product-uuid-2", "quantity": 10 }
    ],
    "notes": "Please deliver by Friday"
  }'
```

#### Success Response (201)

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20260212-00001",
    "buyerId": "retailer-uuid",
    "supplierId": "distributor-uuid",
    "salespersonId": null,
    "status": "PENDING",
    "totalAmount": "3499.85",
    "notes": "Please deliver by Friday",
    "orderLines": [
      {
        "id": "...",
        "productId": "product-uuid-1",
        "quantity": 5,
        "unitPrice": "299.99",
        "totalPrice": "1499.95",
        "product": { "id": "...", "name": "Assam Tea", "sku": "TEA-001", "unit": "kg" }
      },
      {
        "id": "...",
        "productId": "product-uuid-2",
        "quantity": 10,
        "unitPrice": "199.99",
        "totalPrice": "1999.90",
        "product": { "id": "...", "name": "Green Tea", "sku": "TEA-003", "unit": "kg" }
      }
    ],
    "buyer": { "id": "...", "name": "Test Retailer", "loginId": "retailer1", "role": "RETAILER" },
    "supplier": { "id": "...", "name": "Test Distributor", "loginId": "distributor1", "role": "DISTRIBUTOR" },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Error Responses

**Validation Failed (400)**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "supplierId", "message": "supplierId is required" },
    { "field": "items", "message": "At least one item is required" }
  ]
}
```

**Supplier Not Found (404)**

```json
{
  "success": false,
  "message": "Supplier not found"
}
```

**Invalid Supplier Role (400)**

```json
{
  "success": false,
  "message": "Retailers can only order from Distributors"
}
```

**Product Not Found (404)**

```json
{
  "success": false,
  "message": "Product not found: <productId>"
}
```

**Access Denied (403)** — non-retailer user attempts to use this endpoint

```json
{
  "success": false,
  "message": "Access denied. Only retailers can place direct orders."
}
```

---

## Viewing Orders

Retailers can view their orders using:

- **`GET /api/dashboard/retailer`** — Lists all orders where the retailer is the buyer (last 50).
- **`GET /api/orders/:id`** — View a single order's full details. Accessible by the buyer, supplier, salesperson (if any), or admin.

---

## Typical Flow

1. **Login as retailer** — `POST /api/auth/login` with retailer credentials
2. **Browse products** — `GET /api/products` to see available items
3. **Place order** — `POST /api/retailer/orders` with supplierId, items, and optional notes
4. **View orders** — `GET /api/dashboard/retailer` to see order status

This is simpler and faster than the salesperson cart flow since everything happens in a single API call.

---

## Comparison: Retailer Direct Order vs Salesperson Cart

| Feature | Retailer Direct Order | Salesperson Cart |
|---------|----------------------|------------------|
| Steps to create order | 1 API call | 5+ API calls (add items, set buyer, set supplier, checkout) |
| Cart persistence | None (stateless) | Server-side cart persisted in DB |
| Buyer | Auto (logged-in retailer) | Must be explicitly set |
| Supplier | Must be DISTRIBUTOR | Follows buyer-supplier hierarchy |
| Salesperson on order | `null` | Set to the salesperson |
| Who can access | RETAILER only | SALESPERSON only |
