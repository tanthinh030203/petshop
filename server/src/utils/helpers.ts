import { PaginationMeta } from '../types/common.types';

/**
 * Generate a formatted code string with a prefix and zero-padded ID.
 * e.g. generateCode('KH', 1) => 'KH-000001'
 */
export function generateCode(prefix: string, id: number): string {
  return `${prefix}-${id.toString().padStart(6, '0')}`;
}

/**
 * Calculate skip and take values for Prisma pagination.
 */
export function paginate(page: number, limit: number): { skip: number; take: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/**
 * Build pagination metadata for API responses.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}
