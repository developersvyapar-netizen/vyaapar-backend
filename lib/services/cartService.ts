import { UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/config/database';
import { AppError } from '@/lib/errors/AppError';

const BUYER_ROLES: UserRole[] = ['RETAILER', 'DISTRIBUTOR', 'STOCKIST'];

// Valid supplier role for each buyer type: Retailer -> Distributor, Distributor -> Stockist, Stockist -> Admin/Developer
const BUYER_SUPPLIER_MAP: Record<UserRole, UserRole[]> = {
  RETAILER: ['DISTRIBUTOR'],
  DISTRIBUTOR: ['STOCKIST'],
  STOCKIST: ['ADMIN', 'DEVELOPER'],
  ADMIN: [],
  DEVELOPER: [],
  SALESPERSON: [],
};

/** Shared include for full cart responses */
const CART_FULL_INCLUDE = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, sku: true, unit: true },
      },
    },
  },
  buyer: { select: { id: true, name: true, loginId: true, role: true } },
  supplier: { select: { id: true, name: true, loginId: true, role: true } },
} as const;

/**
 * Get or create cart for salesperson. Returns cart with items.
 */
async function getOrCreateCart(salespersonId: string) {
  let cart = await prisma.cart.findUnique({
    where: { salespersonId },
    include: CART_FULL_INCLUDE,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { salespersonId },
      include: CART_FULL_INCLUDE,
    });
  }

  return cart;
}

/**
 * Lightweight: get or create cart returning only the id (no JOINs).
 * Use when you only need cart.id for subsequent writes.
 */
async function ensureCartId(salespersonId: string): Promise<string> {
  const cart = await prisma.cart.findUnique({
    where: { salespersonId },
    select: { id: true },
  });

  if (cart) return cart.id;

  const created = await prisma.cart.create({
    data: { salespersonId },
    select: { id: true },
  });
  return created.id;
}

/**
 * Get current cart with items. Returns null if no cart (should not happen after getOrCreateCart).
 */
async function getCart(salespersonId: string) {
  return getOrCreateCart(salespersonId);
}

/**
 * Add item to cart. Uses current product price. If product already in cart, updates quantity.
 */
async function addItem(salespersonId: string, productId: string, quantity: number) {
  // Lightweight cart fetch (no JOINs) + product lookup in parallel
  const [cartId, product] = await Promise.all([
    ensureCartId(salespersonId),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const unitPrice = product.price;

  // Upsert: create or update cart item in a single query
  return prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId, productId },
    },
    update: { quantity: { increment: quantity }, unitPrice },
    create: { cartId, productId, quantity, unitPrice },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
    },
  });
}

/**
 * Update cart item quantity.
 */
async function updateItem(salespersonId: string, itemId: string, quantity: number) {
  // Lightweight cart fetch + item lookup in parallel
  const [cartId, item] = await Promise.all([
    ensureCartId(salespersonId),
    prisma.cartItem.findUnique({ where: { id: itemId }, select: { id: true, cartId: true } }),
  ]);

  if (!item || item.cartId !== cartId) {
    throw new AppError('Cart item not found', 404);
  }

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
    },
  });
}

/**
 * Remove item from cart.
 */
async function removeItem(salespersonId: string, itemId: string) {
  // Lightweight cart fetch + item lookup in parallel
  const [cartId, item] = await Promise.all([
    ensureCartId(salespersonId),
    prisma.cartItem.findUnique({ where: { id: itemId }, select: { id: true, cartId: true } }),
  ]);

  if (!item || item.cartId !== cartId) {
    throw new AppError('Cart item not found', 404);
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  return { success: true };
}

/**
 * Clear entire cart (delete all items and reset buyer/supplier).
 */
async function clearCart(salespersonId: string) {
  // salespersonId is unique on Cart, so we can update directly without fetching first
  const cart = await prisma.cart.findUnique({
    where: { salespersonId },
    select: { id: true },
  });

  if (!cart) {
    return { success: true };
  }

  await prisma.cart.update({
    where: { salespersonId },
    data: {
      items: { deleteMany: {} },
      buyerId: null,
      supplierId: null,
    },
  });

  return { success: true };
}

/**
 * Set buyer for cart. Buyer must be RETAILER, DISTRIBUTOR, or STOCKIST.
 */
async function setBuyer(salespersonId: string, buyerId: string) {
  // Lightweight cart ID + buyer validation in parallel
  const [cartId, buyer] = await Promise.all([
    ensureCartId(salespersonId),
    prisma.user.findUnique({ where: { id: buyerId, isActive: true } }),
  ]);

  if (!buyer) {
    throw new AppError('Buyer not found', 404);
  }

  if (!BUYER_ROLES.includes(buyer.role)) {
    throw new AppError(
      'Buyer must be a Retailer, Distributor, or Stockist',
      400
    );
  }

  // Update and return full cart in a single query (no second getOrCreateCart)
  return prisma.cart.update({
    where: { id: cartId },
    data: { buyerId },
    include: CART_FULL_INCLUDE,
  });
}

/**
 * Set supplier for cart. Validates buyer-supplier hierarchy.
 */
async function setSupplier(salespersonId: string, supplierId: string) {
  // Lightweight cart fetch (only id + buyerId needed for validation)
  const cart = await prisma.cart.findUnique({
    where: { salespersonId },
    select: { id: true, buyerId: true },
  });

  if (!cart) {
    throw new AppError('Cart not found. Add an item first.', 404);
  }

  if (!cart.buyerId) {
    throw new AppError('Please set buyer before setting supplier', 400);
  }

  // Buyer + supplier validation in parallel
  const [buyer, supplier] = await Promise.all([
    prisma.user.findUnique({ where: { id: cart.buyerId } }),
    prisma.user.findUnique({ where: { id: supplierId, isActive: true } }),
  ]);

  if (!buyer) {
    throw new AppError('Buyer not found', 404);
  }

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  const allowedSupplierRoles = BUYER_SUPPLIER_MAP[buyer.role];
  if (!allowedSupplierRoles.includes(supplier.role)) {
    throw new AppError(
      `Invalid supplier for ${buyer.role} buyer. Expected: ${allowedSupplierRoles.join(' or ')}`,
      400
    );
  }

  // Update and return full cart in a single query (no second getOrCreateCart)
  return prisma.cart.update({
    where: { id: cart.id },
    data: { supplierId },
    include: CART_FULL_INCLUDE,
  });
}

/**
 * Generate unique order number: ORD-YYYYMMDD-XXXXX
 */
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let seq = 1;
  if (lastOrder) {
    const suffix = lastOrder.orderNumber.slice(prefix.length);
    const num = parseInt(suffix, 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }

  const orderNumber = `${prefix}${seq.toString().padStart(5, '0')}`;
  return orderNumber;
}

/**
 * Create order from cart (checkout). Validates items, buyer, supplier. Clears cart on success.
 * Retries up to 3 times on order number collision (P2002 unique constraint).
 */
async function checkout(salespersonId: string, notes?: string) {
  const cart = await getOrCreateCart(salespersonId);

  if (!cart.items.length) {
    throw new AppError('Cart is empty. Add items before checkout.', 400);
  }

  if (!cart.buyerId || !cart.buyer) {
    throw new AppError('Please select a buyer before checkout.', 400);
  }

  if (!cart.supplierId || !cart.supplier) {
    throw new AppError('Please select a supplier before checkout.', 400);
  }

  // Compute totals and order lines data before the transaction
  let totalAmount = new Decimal(0);
  const orderLinesData: Array<{
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    totalPrice: Decimal;
  }> = [];

  for (const item of cart.items) {
    const totalPrice = new Decimal(item.unitPrice).mul(item.quantity);
    totalAmount = totalAmount.add(totalPrice);
    orderLinesData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice,
    });
  }

  // Retry loop to handle order number collisions from concurrent requests (e.g. double-tap).
  // On P2002 (unique constraint violation), regenerate the order number and retry.
  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const orderNumber = await generateOrderNumber();

      // Use batch transaction (compatible with PgBouncer connection pooling)
      const [order] = await prisma.$transaction([
        prisma.order.create({
          data: {
            orderNumber,
            buyerId: cart.buyerId!,
            supplierId: cart.supplierId!,
            salespersonId,
            status: 'PENDING',
            totalAmount,
            notes: notes ?? null,
            orderLines: {
              create: orderLinesData,
            },
          },
          include: {
            orderLines: {
              include: {
                product: { select: { id: true, name: true, sku: true, unit: true } },
              },
            },
            buyer: { select: { id: true, name: true, loginId: true, role: true } },
            supplier: { select: { id: true, name: true, loginId: true, role: true } },
          },
        }),
        prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        }),
        prisma.cart.update({
          where: { id: cart.id },
          data: {
            buyerId: null,
            supplierId: null,
          },
        }),
      ]);

      return order;
    } catch (err: unknown) {
      lastError = err;
      const prismaErr = err as { code?: string };
      // P2002 = unique constraint violation (order number collision) — retry
      if (prismaErr.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw err;
    }
  }

  // Should not reach here, but just in case
  throw lastError;
}

const cartService = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  setBuyer,
  setSupplier,
  checkout,
};

export default cartService;
