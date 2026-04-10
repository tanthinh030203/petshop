import api from './api';
import type { ApiResponse, Service, PaginatedResponse } from '@/types';

export const serviceService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Service>> {
    const { data } = await api.get<PaginatedResponse<Service>>('/services', { params });
    return data;
  },

  async getById(id: number): Promise<Service> {
    const { data } = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return data.data;
  },

  async create(payload: Partial<Service>): Promise<Service> {
    const { data } = await api.post<ApiResponse<Service>>('/services', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<Service>): Promise<Service> {
    const { data } = await api.put<ApiResponse<Service>>(`/services/${id}`, payload);
    return data.data;
  },
};
