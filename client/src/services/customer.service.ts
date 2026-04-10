import api from './api';
import type { ApiResponse, Customer, Pet, PaginatedResponse } from '@/types';

export const customerService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Customer>> {
    const { data } = await api.get<PaginatedResponse<Customer>>('/customers', { params });
    return data;
  },

  async getById(id: number): Promise<Customer> {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },

  async create(payload: Partial<Customer>): Promise<Customer> {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<Customer>): Promise<Customer> {
    const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },

  async search(q: string): Promise<Customer[]> {
    const { data } = await api.get<ApiResponse<Customer[]>>('/customers/search', {
      params: { q },
    });
    return data.data;
  },

  async getPets(id: number): Promise<Pet[]> {
    const { data } = await api.get<ApiResponse<Pet[]>>(`/customers/${id}/pets`);
    return data.data;
  },
};
