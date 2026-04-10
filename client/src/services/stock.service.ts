import api from './api';
import type { ApiResponse, BranchStock, PaginatedResponse } from '@/types';

export interface StockMovement {
  id: number;
  branch_id: number;
  product_id: number;
  type: 'import' | 'export' | 'transfer' | 'adjustment';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  note?: string;
  created_by: number;
  created_at: string;
}

export interface StockImportPayload {
  branch_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    cost_price?: number;
    note?: string;
  }>;
  note?: string;
}

export interface StockExportPayload {
  branch_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    note?: string;
  }>;
  note?: string;
}

export interface StockTransferPayload {
  from_branch_id: number;
  to_branch_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  note?: string;
}

export const stockService = {
  async getStock(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<BranchStock>> {
    const { data } = await api.get<PaginatedResponse<BranchStock>>('/stock', {
      params,
    });
    return data;
  },

  async importStock(payload: StockImportPayload): Promise<StockMovement[]> {
    const { data } = await api.post<ApiResponse<StockMovement[]>>(
      '/stock/import',
      payload,
    );
    return data.data;
  },

  async exportStock(payload: StockExportPayload): Promise<StockMovement[]> {
    const { data } = await api.post<ApiResponse<StockMovement[]>>(
      '/stock/export',
      payload,
    );
    return data.data;
  },

  async transferStock(payload: StockTransferPayload): Promise<StockMovement[]> {
    const { data } = await api.post<ApiResponse<StockMovement[]>>(
      '/stock/transfer',
      payload,
    );
    return data.data;
  },

  async getMovements(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<StockMovement>> {
    const { data } = await api.get<PaginatedResponse<StockMovement>>(
      '/stock/movements',
      { params },
    );
    return data;
  },
};
