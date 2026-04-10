import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';

interface GetAllQuery {
  page: number;
  limit: number;
  branchId: number;
  status?: string;
  customerId?: number;
  from?: string;
  to?: string;
}

export const getAll = async (query: GetAllQuery) => {
  const { page, limit, branchId, status, customerId, from, to } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = { branchId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, code: true } },
        creator: { select: { id: true, fullName: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, fullName: true, phone: true, code: true } },
      creator: { select: { id: true, fullName: true } },
      invoiceItems: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          service: { select: { id: true, name: true, code: true } },
        },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
      },
    },
  });

  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  }

  return invoice;
};

async function generateInvoiceNumber(branchId: number): Promise<string> {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  }

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${branch.code}-${dateStr}`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
  });

  let seq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

export const create = async (branchId: number, createdBy: number, data: any) => {
  const invoiceNumber = await generateInvoiceNumber(branchId);

  // Calculate subtotal and total from items
  let subtotal = new Decimal(0);
  const itemsData = data.items.map((item: any) => {
    const qty = new Decimal(item.quantity);
    const price = new Decimal(item.unitPrice);
    const discount = new Decimal(item.discount || 0);
    const lineTotal = qty.mul(price).minus(discount);
    subtotal = subtotal.plus(lineTotal);

    return {
      itemType: item.itemType,
      productId: item.productId || null,
      serviceId: item.serviceId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      lineTotal,
    };
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        branchId,
        createdBy,
        customerId: data.customerId,
        appointmentId: data.appointmentId,
        invoiceNumber,
        type: data.type,
        subtotal,
        totalAmount: subtotal,
        note: data.note,
        invoiceItems: {
          create: itemsData,
        },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        invoiceItems: true,
      },
    });

    return created;
  });

  return invoice;
};

export const updateStatus = async (id: number, status: string) => {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: status as any },
  });

  return invoice;
};

export const addPayment = async (
  invoiceId: number,
  branchId: number,
  createdBy: number,
  data: any,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    }

    if (invoice.status === 'voided') {
      throw Object.assign(new Error('Cannot add payment to a voided invoice'), { statusCode: 400 });
    }

    if (invoice.status === 'paid') {
      throw Object.assign(new Error('Invoice is already fully paid'), { statusCode: 400 });
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        branchId,
        createdBy,
        amount: data.amount,
        method: data.method,
        referenceNo: data.referenceNo,
        note: data.note,
      },
    });

    // Calculate total paid
    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Decimal(0),
    ).plus(new Decimal(data.amount));

    // Update invoice status based on total paid
    let newStatus: string;
    if (totalPaid.gte(invoice.totalAmount)) {
      newStatus = 'paid';
    } else {
      newStatus = 'partial';
    }

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus as any },
      include: {
        payments: { orderBy: { paidAt: 'desc' } },
        customer: { select: { id: true, fullName: true } },
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  return result;
};
