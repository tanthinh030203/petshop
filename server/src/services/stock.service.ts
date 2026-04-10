import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';

interface GetStockQuery {
  page: number;
  limit: number;
  search?: string;
  lowStock?: boolean;
}

export const getStock = async (branchId: number, query: GetStockQuery) => {
  const { page, limit, search, lowStock } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = { branchId };
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
      ],
    };
  }

  const [allStocks, total] = await Promise.all([
    prisma.branchStock.findMany({
      where,
      skip: lowStock ? undefined : skip,
      take: lowStock ? undefined : take,
      orderBy: { product: { name: 'asc' } },
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: true, sellingPrice: true, costPrice: true },
        },
      },
    }),
    prisma.branchStock.count({ where }),
  ]);

  // Filter low stock in memory if needed (quantity <= minQuantity)
  let data = allStocks;
  let finalTotal = total;
  if (lowStock) {
    data = allStocks.filter((s) => s.quantity <= s.minQuantity);
    finalTotal = data.length;
    data = data.slice(skip, skip + take);
  }

  return { data, meta: buildPaginationMeta(finalTotal, page, limit) };
};

export const importStock = async (branchId: number, userId: number, items: any[]) => {
  const result = await prisma.$transaction(async (tx) => {
    const movements = [];

    for (const item of items) {
      // Upsert branch stock (increment quantity)
      await tx.branchStock.upsert({
        where: {
          branchId_productId: { branchId, productId: item.productId },
        },
        create: {
          branchId,
          productId: item.productId,
          quantity: item.quantity,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          branchId,
          productId: item.productId,
          userId,
          type: 'import_stock',
          quantity: item.quantity,
          note: item.note,
        },
      });

      movements.push(movement);
    }

    return movements;
  });

  return result;
};

export const exportStock = async (branchId: number, userId: number, items: any[]) => {
  const result = await prisma.$transaction(async (tx) => {
    const movements = [];

    for (const item of items) {
      // Check sufficient stock
      const stock = await tx.branchStock.findUnique({
        where: {
          branchId_productId: { branchId, productId: item.productId },
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        throw Object.assign(
          new Error(`Insufficient stock for product "${product?.name || item.productId}". Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`),
          { statusCode: 400 },
        );
      }

      // Decrement quantity
      await tx.branchStock.update({
        where: {
          branchId_productId: { branchId, productId: item.productId },
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          branchId,
          productId: item.productId,
          userId,
          type: 'export_stock',
          quantity: item.quantity,
          note: item.note,
        },
      });

      movements.push(movement);
    }

    return movements;
  });

  return result;
};

export const transferStock = async (
  fromBranchId: number,
  toBranchId: number,
  userId: number,
  items: any[],
) => {
  const result = await prisma.$transaction(async (tx) => {
    const movements = [];

    for (const item of items) {
      // Check sufficient stock at source
      const sourceStock = await tx.branchStock.findUnique({
        where: {
          branchId_productId: { branchId: fromBranchId, productId: item.productId },
        },
      });

      if (!sourceStock || sourceStock.quantity < item.quantity) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        throw Object.assign(
          new Error(`Insufficient stock for product "${product?.name || item.productId}" at source branch. Available: ${sourceStock?.quantity || 0}, Requested: ${item.quantity}`),
          { statusCode: 400 },
        );
      }

      // Decrement from source
      await tx.branchStock.update({
        where: {
          branchId_productId: { branchId: fromBranchId, productId: item.productId },
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });

      // Upsert to destination
      await tx.branchStock.upsert({
        where: {
          branchId_productId: { branchId: toBranchId, productId: item.productId },
        },
        create: {
          branchId: toBranchId,
          productId: item.productId,
          quantity: item.quantity,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });

      // Create movements for both branches
      const exportMovement = await tx.stockMovement.create({
        data: {
          branchId: fromBranchId,
          productId: item.productId,
          userId,
          type: 'transfer',
          quantity: -item.quantity,
          referenceType: 'transfer',
          note: `Transfer to branch ${toBranchId}`,
        },
      });

      const importMovement = await tx.stockMovement.create({
        data: {
          branchId: toBranchId,
          productId: item.productId,
          userId,
          type: 'transfer',
          quantity: item.quantity,
          referenceType: 'transfer',
          note: `Transfer from branch ${fromBranchId}`,
        },
      });

      movements.push(exportMovement, importMovement);
    }

    return movements;
  });

  return result;
};

interface GetMovementsQuery {
  page: number;
  limit: number;
  productId?: number;
  type?: string;
  from?: string;
  to?: string;
}

export const getMovements = async (branchId: number, query: GetMovementsQuery) => {
  const { page, limit, productId, type, from, to } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = { branchId };
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};
