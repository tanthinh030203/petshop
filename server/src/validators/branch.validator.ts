import { z } from 'zod';

export const createBranchSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateBranchSchema = z.object({
  code: z.string().max(20).optional(),
  name: z.string().max(200).optional(),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const branchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type BranchQuery = z.infer<typeof branchQuerySchema>;
