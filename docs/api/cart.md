# Cart API

This document covers the shopping cart and order creation endpoints. Salespersons can add products to a cart, set buyer and supplier, then create orders for Retailers, Distributors, or Stockists.

## Overview

- **Cart** is session-based and tied to the authenticated salesperson (one cart per salesperson).
- **Buyer** must be RETAILER, DISTRIBUTOR, or STOCKIST.
- **Supplier** is validated by buyer type: Retailer → Distributor; Distributor → Stockist; Stockist → Admin/Developer.
- **Checkout** creates an Order with status PENDING, copies cart items as OrderLines, then clears the cart.

### Endpoint Summary

| Endpoint | Method | Auth Required | Role Access |
|----------|--------|---------------|-------------|
| `/api/cart` | GET | Yes | SALESPERSON |
| `/api/cart` | DELETE | Yes | SALESPERSON |
| `/api/cart/items` | POST | Yes | SALESPERSON |
| `/api/cart/items/:itemId` | PUT | Yes | SALESPERSON |
| `/api/cart/items/:itemId` | DELETE | Yes | SALESPERSON |
| `/api/cart/buyer` | PUT | Yes | SALESPERSON |
| `/api/cart/supplier` | PUT | Yes | SALESPERSON |
| `/api/cart/checkout` | POST | Yes | SALESPERSON |

---

## Cart Management

### GET /api/cart

Get current cart with items, buyer, and supplier. Creates an empty cart if none exists.

#### Request

```bash
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "salespersonId": "salesperson-uuid",
    "buyerId": "buyer-uuid",
    "supplierId": "supplier-uuid",
    "items": [
      {
        "id": "item-uuid",
        "cartId": "cart-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "unitPrice": "99.99",
        "product": {
          "id": "product-uuid",
          "name": "Product A",
          "sku": "SKU-001",
          "unit": "piece"
        }
      }
    ],
    "buyer": { "id": "...", "name": "...", "loginId": "...", "role": "RETAILER" },
    "supplier": { "id": "...", "name": "...", "loginId": "...", "role": "DISTRIBUTOR" },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### POST /api/cart/items

Add a product to the cart. Uses the product's current price. If the product is already in the cart, quantity is increased.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string (UUID) | Yes | Product ID |
| quantity | number (integer ≥ 1) | Yes | Quantity to add |

#### Request

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "product-uuid", "quantity": 2}'
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 2,
    "unitPrice": "99.99",
    "product": {
      "id": "product-uuid",
      "name": "Product A",
      "sku": "SKU-001",
      "unit": "piece"
    }
  }
}
```

#### Error Responses

**Product Not Found (404)**  
**Validation Failed (400)** – invalid productId or quantity

---

### PUT /api/cart/items/:itemId

Update the quantity of a cart item.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| quantity | number (integer ≥ 1) | Yes | New quantity |

#### Request

```bash
curl -X PUT http://localhost:3000/api/cart/items/ITEM_UUID \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

#### Success Response (200)

Returns the updated cart item with product details.

#### Error Responses

**Cart item not found (404)**  
**Invalid item ID format (400)**  
**Validation failed (400)** – quantity invalid

---

### DELETE /api/cart/items/:itemId

Remove a single item from the cart.

#### Request

```bash
curl -X DELETE http://localhost:3000/api/cart/items/ITEM_UUID \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### DELETE /api/cart

Clear the entire cart (all items, buyer, and supplier).

#### Request

```bash
curl -X DELETE http://localhost:3000/api/cart \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Buyer and Supplier

### PUT /api/cart/buyer

Set the buyer for the cart. Buyer must be a user with role RETAILER, DISTRIBUTOR, or STOCKIST.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| buyerId | string (UUID) | Yes | User ID of the buyer |

#### Request

```bash
curl -X PUT http://localhost:3000/api/cart/buyer \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"buyerId": "retailer-user-uuid"}'
```

#### Success Response (200)

Returns the full cart (including items, buyer, supplier).

#### Error Responses

**Buyer not found (404)**  
**Buyer must be a Retailer, Distributor, or Stockist (400)**

---

### PUT /api/cart/supplier

Set the supplier for the cart. Must be set after buyer. Supplier role must match buyer hierarchy:

| Buyer Role | Allowed Supplier Role(s) |
|------------|--------------------------|
| RETAILER | DISTRIBUTOR |
| DISTRIBUTOR | STOCKIST |
| STOCKIST | ADMIN, DEVELOPER |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| supplierId | string (UUID) | Yes | User ID of the supplier |

#### Request

```bash
curl -X PUT http://localhost:3000/api/cart/supplier \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supplierId": "distributor-user-uuid"}'
```

#### Success Response (200)

Returns the full cart.

#### Error Responses

**Please set buyer before setting supplier (400)**  
**Supplier not found (404)**  
**Invalid supplier for buyer type (400)**

---

## Order Creation (Checkout)

### POST /api/cart/checkout

Create an order from the current cart. Validates that the cart has at least one item, a buyer, and a supplier. Order is created with status PENDING; cart is cleared after success.

**Order number format:** `ORD-YYYYMMDD-XXXXX` (e.g. `ORD-20260130-00001`).

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| notes | string | No | Optional order notes (max 2000 chars) |

#### Request

```bash
curl -X POST http://localhost:3000/api/cart/checkout \
  -H "Authorization: Bearer SALESPERSON_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Urgent delivery"}'
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20260130-00001",
    "buyerId": "...",
    "supplierId": "...",
    "salespersonId": "...",
    "status": "PENDING",
    "totalAmount": "199.98",
    "notes": "Urgent delivery",
    "orderLines": [
      {
        "id": "...",
        "productId": "...",
        "quantity": 2,
        "unitPrice": "99.99",
        "totalPrice": "199.98",
        "product": { "id": "...", "name": "...", "sku": "...", "unit": "..." }
      }
    ],
    "buyer": { "id": "...", "name": "...", "loginId": "...", "role": "RETAILER" },
    "supplier": { "id": "...", "name": "...", "loginId": "...", "role": "DISTRIBUTOR" },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Error Responses

**Cart is empty (400)**  
**Please select a buyer before checkout (400)**  
**Please select a supplier before checkout (400)**  
**Validation failed (400)** – e.g. notes too long

---

## Typical Flow

1. **Get cart** – `GET /api/cart`
2. **Add items** – `POST /api/cart/items` (productId, quantity) for each product
3. **Update quantities** (optional) – `PUT /api/cart/items/:itemId` with `{ quantity }`
4. **Set buyer** – `PUT /api/cart/buyer` with `{ buyerId }` (RETAILER / DISTRIBUTOR / STOCKIST)
5. **Set supplier** – `PUT /api/cart/supplier` with `{ supplierId }` (must match buyer hierarchy)
6. **Checkout** – `POST /api/cart/checkout` with optional `{ notes }`

After checkout, the cart is empty and the order appears in the salesperson's dashboard and in orders for the buyer/supplier.
