import { z } from 'zod';

export const createInvoiceSchema = z.object({
  customerId: z.number().int().positive(),
  appointmentId: z.number().int().positive().optional(),
  type: z.enum(['sale', 'service', 'mixed']),
  items: z.array(z.object({
    itemType: z.enum(['product', 'service']),
    productId: z.number().int().positive().optional(),
    serviceId: z.number().int().positive().optional(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discount: z.number().nonnegative().optional(),
  })).min(1, 'At least one item is required'),
  note: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'partial', 'voided']),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['cash', 'card', 'transfer', 'momo', 'zalopay', 'vnpay', 'other']),
  referenceNo: z.string().optional(),
  note: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
