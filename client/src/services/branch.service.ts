import api from './api';
import type { ApiResponse, Branch, PaginatedResponse } from '@/types';

export const branchService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Branch>> {
    const { data } = await api.get<PaginatedResponse<Branch>>('/branches', { params });
    return data;
  },

  async getById(id: number): Promise<Branch> {
    const { data } = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
    return data.data;
  },

  async create(payload: Partial<Branch>): Promise<Branch> {
    const { data } = await api.post<ApiResponse<Branch>>('/branches', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<Branch>): Promise<Branch> {
    const { data } = await api.put<ApiResponse<Branch>>(`/branches/${id}`, payload);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/branches/${id}`);
  },
};
