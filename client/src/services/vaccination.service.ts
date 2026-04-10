import api from './api';
import type { ApiResponse, PaginatedResponse, Vaccination } from '@/types';

export const vaccinationService = {
  async getAll(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Vaccination>> {
    const { data } = await api.get<PaginatedResponse<Vaccination>>(
      '/vaccinations',
      { params },
    );
    return data;
  },

  async create(payload: Partial<Vaccination>): Promise<Vaccination> {
    const { data } = await api.post<ApiResponse<Vaccination>>(
      '/vaccinations',
      payload,
    );
    return data.data;
  },

  async getById(id: number): Promise<Vaccination> {
    const { data } = await api.get<ApiResponse<Vaccination>>(`/vaccinations/${id}`);
    return data.data;
  },

  async getReminders(): Promise<Vaccination[]> {
    const { data } = await api.get<ApiResponse<Vaccination[]>>(
      '/vaccinations/reminders',
    );
    return data.data;
  },
};
