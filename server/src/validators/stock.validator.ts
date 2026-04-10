import { z } from 'zod';

const stockItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

export const importStockSchema = z.object({
  items: z.array(stockItemSchema).min(1, 'At least one item is required'),
});

export const exportStockSchema = z.object({
  items: z.array(stockItemSchema).min(1, 'At least one item is required'),
});

export const transferStockSchema = z.object({
  toBranchId: z.number().int().positive(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
});

export type ImportStockInput = z.infer<typeof importStockSchema>;
export type ExportStockInput = z.infer<typeof exportStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
