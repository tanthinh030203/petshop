import api from './api';
import type { ApiResponse, User, PaginatedResponse } from '@/types';

export const userService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  async create(payload: Partial<User>): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/users', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<User>): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },

  async updateStatus(id: number, isActive: boolean): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}/status`, {
      is_active: isActive,
    });
    return data.data;
  },
};
