# Multi-tier Distribution System - Schema Explanation

## System Overview

This is a **multi-tier distribution and ordering system** where products flow from Admin → Stockists → Distributors → Retailers. Only **salespersons** can create orders on behalf of buyers.

---

## Core Models

### 1. **User Model**
Represents all people in the system with different roles.

**Fields:**
- `id`, `email`, `username`, `password` - Basic authentication
- `name`, `phone`, `address` - Contact information
- `role` - Defines what this user can do (see roles below)
- `isActive` - Whether the account is active

**Roles (UserRole Enum):**
- **ADMIN**: System administrator, top-level supplier
- **DEVELOPER**: Technical administrator
- **STOCKIST**: Mid-level supplier (sells to Distributors)
- **DISTRIBUTOR**: Lower-level supplier (sells to Retailers)
- **RETAILER**: End buyer (purchases from Distributors)
- **SALESPERSON**: Creates orders on behalf of others

**Relationships:**
- `creator/createdUsers` - Tracks who created this user (admin/developer hierarchy)
- `ordersAsBuyer` - Orders where this user is purchasing
- `ordersAsSupplier` - Orders where this user is selling
- `ordersAsSalesperson` - Orders this salesperson created
- `inventory` - Stock items this user has (for Distributors, Stockists, Admin)

---

### 2. **Product Model**
Represents items that can be ordered.

**Fields:**
- `id`, `name`, `description` - Product identification
- `sku` - Unique stock keeping unit code
- `price` - Base price (Decimal for precision)
- `unit` - Measurement unit (e.g., "kg", "piece", "box")

**Relationships:**
- `orderLines` - All order lines containing this product
- `inventory` - Stock levels across different suppliers
- `mainStock` - Admin's central warehouse inventory

---

### 3. **MainStock Model**
Admin's central warehouse inventory - the main stock pool from which all supply chain distribution begins.

**Fields:**
- `productId` - Which product
- `quantity` - Total units available in admin's main warehouse
- `lastUpdatedBy` - User ID who last modified this stock

**Unique Constraint:**
- `productId` - Only one main stock record per product

**Purpose:**
- Admin adds items to MainStock (e.g., purchases from manufacturers)
- When Stockists order from Admin, stock is taken from MainStock
- This is the top-level inventory in the supply chain

**Example:**
```
MainStock:
- Tea Leaf: 10,000 kg (Admin's warehouse)

When Stockist orders 1,000 kg from Admin:
- MainStock Tea Leaf: 10,000 - 1,000 = 9,000 kg
- Stockist Inventory: +1,000 kg
```

---

### 4. **Inventory Model**
Tracks how much stock each supplier has for each product.

**Fields:**
- `userId` - Which supplier owns this stock (Distributor, Stockist, or Admin)
- `productId` - Which product
- `quantity` - How many units available

**Unique Constraint:**
- `(userId, productId)` - Each supplier can only have one inventory record per product

**Example:**
```
Distributor A has 100 units of Product X
Distributor B has 50 units of Product X
Stockist Y has 500 units of Product X
```

---

### 5. **Order Model**
Represents a purchase transaction from buyer to supplier.

**Fields:**
- `orderNumber` - Unique identifier (e.g., "ORD-2024-001")
- `buyerId` - Who is purchasing (Retailer, Distributor, or Stockist)
- `supplierId` - Who is selling (Distributor, Stockist, or Admin)
- `salespersonId` - Which salesperson created this order (REQUIRED)
- `status` - Current order state (PENDING, APPROVED, etc.)
- `totalAmount` - Total order value
- `notes` - Additional information

**Tracking Fields:**
- `approvedAt`, `approvedBy` - Approval timestamp and user
- `cancelledAt`, `cancelledBy`, `cancelReason` - Cancellation details (only SALESPERSON/ADMIN)

**Order Status (OrderStatus Enum):**
- `PENDING` - Waiting for approval
- `APPROVED` - Supplier approved the order
- `REJECTED` - Supplier rejected the order
- `PROCESSING` - Order is being prepared
- `SHIPPED` - Order has been sent
- `DELIVERED` - Order received by buyer
- `CANCELLED` - Order was cancelled (only by SALESPERSON/ADMIN)

---

### 6. **OrderLine Model**
Individual items within an order.

**Fields:**
- `orderId` - Which order this belongs to
- `productId` - Which product
- `quantity` - How many units
- `unitPrice` - Price per unit at time of order
- `totalPrice` - quantity × unitPrice
- `notes` - Item-specific notes

---

## Business Rules & Workflows

### Rule 1: Who Can Create Orders?
**ONLY SALESPERSONS** can create orders. Buyers (Retailers, Distributors, Stockists) cannot directly place orders.

**Workflow:**
1. Retailer contacts Salesperson: "I need 100 units of Product X"
2. Salesperson checks Distributor inventory
3. Salesperson creates order on behalf of Retailer

### Rule 2: Supply Chain Hierarchy
```
ADMIN (top supplier)
  ↓ supplies to
STOCKIST
  ↓ supplies to
DISTRIBUTOR
  ↓ supplies to
RETAILER (end buyer)
```

**Who can buy from whom:**
- Retailers buy from Distributors
- Distributors buy from Stockists  
- Stockists buy from Admin

### Rule 3: Multiple Suppliers
If one supplier doesn't have enough stock, buyers can split orders across multiple suppliers.

**Example Scenario:**
```
Retailer needs: 100 units of Product X

Check inventory:
- Distributor A has: 60 units
- Distributor B has: 50 units

Solution - Salesperson creates 2 orders:

Order #1:
- Buyer: Retailer
- Supplier: Distributor A
- Quantity: 60 units

Order #2:
- Buyer: Retailer
- Supplier: Distributor B
- Quantity: 40 units

Total received: 100 units ✓
```

### Rule 4: Order Cancellation
**ONLY SALESPERSONS and ADMINS** can cancel orders.

When cancelled:
- `status` → `CANCELLED`
- `cancelledAt` → current timestamp
- `cancelledBy` → user ID (must be SALESPERSON or ADMIN)
- `cancelReason` → optional explanation

---

## Real-World Example

### Setup:
```
MainStock (Admin's warehouse):
- Tea Leaf: 10,000 kg

Products:
- Product "Tea Leaf" (SKU: TEA-001, Price: $50/kg)

Users:
- Admin (manages main stock)
- Stockist S1 (has 1000 kg of tea leaf)
- Distributor D1 (has 200 kg of tea leaf)
- Distributor D2 (has 150 kg of tea leaf)
- Retailer R1 (wants to buy)
- Salesperson SP1
```

### Scenario: Retailer needs 300 kg of tea leaf

**Step 1: Check Distributor Inventory**
```sql
SELECT * FROM inventory 
WHERE productId = 'TEA-001' 
AND userId IN (SELECT id FROM users WHERE role = 'DISTRIBUTOR')

Results:
- D1: 200 kg
- D2: 150 kg
```

**Step 2: Salesperson creates orders**

**Order #1:**
```
orderNumber: "ORD-2024-001"
buyer: R1 (Retailer)
supplier: D1 (Distributor)
salesperson: SP1
totalAmount: $10,000 (200 × $50)
status: PENDING

OrderLine:
- product: Tea Leaf
- quantity: 200
- unitPrice: $50
- totalPrice: $10,000
```

**Order #2:**
```
orderNumber: "ORD-2024-002"
buyer: R1 (Retailer)
supplier: D2 (Distributor)
salesperson: SP1
totalAmount: $5,000 (100 × $50)
status: PENDING

OrderLine:
- product: Tea Leaf
- quantity: 100
- unitPrice: $50
- totalPrice: $5,000
```

**Step 3: Orders get approved**
- D1 approves Order #1 → status: APPROVED
- D2 approves Order #2 → status: APPROVED

**Step 4: Inventory updates**
```
D1 inventory: 200 - 200 = 0 kg
D2 inventory: 150 - 100 = 50 kg
```

---

## Key Advantages

1. **Clear Authorization**: Only salespersons create orders, preventing unauthorized purchasing
2. **Flexible Sourcing**: Buyers can source from multiple suppliers
3. **Centralized Main Stock**: Admin manages a central warehouse (MainStock) as the source of all inventory
4. **Distributed Inventory Tracking**: Real-time stock levels per supplier
5. **Audit Trail**: Tracks who created, approved, and cancelled orders
6. **Multi-tier Support**: Handles complex supply chains with multiple levels
7. **Scalability**: Can add more distributors, stockists, or products easily

---

## Stock Flow Example

```
1. Admin adds to MainStock: 10,000 kg Tea Leaf

2. Stockist orders from Admin (via Salesperson):
   MainStock: 10,000 - 2,000 = 8,000 kg
   Stockist Inventory: +2,000 kg

3. Distributor orders from Stockist (via Salesperson):
   Stockist Inventory: 2,000 - 500 = 1,500 kg
   Distributor Inventory: +500 kg

4. Retailer orders from Distributor (via Salesperson):
   Distributor Inventory: 500 - 100 = 400 kg
   Retailer receives: 100 kg
```

---

## Database Indexes

The schema includes indexes on frequently queried fields:
- User: `role`, `email`, `username`
- Product: `sku`, `name`
- MainStock: `productId`
- Inventory: `userId`, `productId`
- Order: `buyerId`, `supplierId`, `salespersonId`, `status`, `orderNumber`
- OrderLine: `orderId`, `productId`

These improve query performance for common operations like:
- Finding all orders by a buyer
- Checking main stock levels
- Checking inventory for a product across suppliers
- Filtering orders by status
- Looking up users by role