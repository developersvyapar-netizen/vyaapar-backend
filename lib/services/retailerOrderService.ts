import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/config/database';
import { AppError } from '@/lib/errors/AppError';

interface OrderItemInput {
  productId: string;
  quantity: number;
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

  return `${prefix}${seq.toString().padStart(5, '0')}`;
}

/**
 * Create a direct order for a retailer (no cart, no salesperson).
 * The retailer is automatically the buyer.
 */
async function createOrder(
  retailerId: string,
  supplierId: string,
  items: OrderItemInput[],
  notes?: string
) {
  // Validate supplier exists and is a DISTRIBUTOR (retailers buy from distributors)
  const supplier = await prisma.user.findUnique({
    where: { id: supplierId, isActive: true },
  });

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  if (supplier.role !== 'DISTRIBUTOR') {
    throw new AppError(
      'Retailers can only order from Distributors',
      400
    );
  }

  // Fetch all products in parallel and validate
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build order lines and compute total
  let totalAmount = new Decimal(0);
  const orderLinesData: Array<{
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    totalPrice: Decimal;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    const unitPrice = product.price;
    const totalPrice = new Decimal(unitPrice).mul(item.quantity);
    totalAmount = totalAmount.add(totalPrice);

    orderLinesData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    });
  }

  // Create order with retry on order number collision
  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const orderNumber = await generateOrderNumber();

      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerId: retailerId,
          supplierId,
          salespersonId: null, // Self-order, no salesperson
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
      });

      return order;
    } catch (err: unknown) {
      lastError = err;
      const prismaErr = err as { code?: string };
      if (prismaErr.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

const retailerOrderService = {
  createOrder,
};

export default retailerOrderService;
