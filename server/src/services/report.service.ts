import prisma from '../config/database';

export const getRevenue = async (branchId: number | undefined, from: string, to: string) => {
  const where: any = {
    status: 'paid',
    createdAt: {
      gte: new Date(from),
      lte: new Date(to),
    },
  };
  if (branchId) where.branchId = branchId;

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const dailyMap = new Map<string, number>();
  for (const inv of invoices) {
    const dateKey = inv.createdAt.toISOString().slice(0, 10);
    const current = dailyMap.get(dateKey) || 0;
    dailyMap.set(dateKey, current + Number(inv.totalAmount));
  }

  const dailyTotals = Array.from(dailyMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  const grandTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);

  return { dailyTotals, grandTotal };
};

export const getTopProducts = async (
  branchId: number | undefined,
  from: string,
  to: string,
  limit: number = 10,
) => {
  const where: any = {
    itemType: 'product',
    invoice: {
      status: 'paid',
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  };
  if (branchId) where.invoice.branchId = branchId;

  const items = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where,
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  // Fetch product details
  const productIds = items.map((i) => i.productId).filter((id): id is number => id !== null);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => ({
    product: productMap.get(item.productId!) || null,
    totalQuantity: Number(item._sum.quantity) || 0,
    totalRevenue: Number(item._sum.lineTotal) || 0,
  }));
};

export const getTopServices = async (
  branchId: number | undefined,
  from: string,
  to: string,
  limit: number = 10,
) => {
  const where: any = {
    itemType: 'service',
    invoice: {
      status: 'paid',
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  };
  if (branchId) where.invoice.branchId = branchId;

  const items = await prisma.invoiceItem.groupBy({
    by: ['serviceId'],
    where,
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const serviceIds = items.map((i) => i.serviceId).filter((id): id is number => id !== null);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, code: true },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  return items.map((item) => ({
    service: serviceMap.get(item.serviceId!) || null,
    totalQuantity: Number(item._sum.quantity) || 0,
    totalRevenue: Number(item._sum.lineTotal) || 0,
  }));
};

export const getCustomerStats = async (
  branchId: number | undefined,
  from: string,
  to: string,
) => {
  const where: any = {};
  if (branchId) where.branchId = branchId;

  const totalCustomers = await prisma.customer.count({ where });

  const newCustomers = await prisma.customer.count({
    where: {
      ...where,
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
  });

  return { totalCustomers, newCustomers };
};

export const getAppointmentStats = async (
  branchId: number | undefined,
  from: string,
  to: string,
) => {
  const where: any = {
    appointmentDate: {
      gte: new Date(from),
      lte: new Date(to),
    },
  };
  if (branchId) where.branchId = branchId;

  const [byStatus, byType] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    }),
    prisma.appointment.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
  };
};

export const getStockAlerts = async (branchId: number | undefined) => {
  const where: any = {};
  if (branchId) where.branchId = branchId;

  const alerts = await prisma.branchStock.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  // Filter in application: quantity <= minQuantity
  return alerts.filter((s) => s.quantity <= s.minQuantity);
};
