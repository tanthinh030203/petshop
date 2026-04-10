import api from './api';
import type { ApiResponse, MedicalRecord, PaginatedResponse, Prescription } from '@/types';

export const medicalService = {
  async getAll(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<MedicalRecord>> {
    const { data } = await api.get<PaginatedResponse<MedicalRecord>>(
      '/medical-records',
      { params },
    );
    return data;
  },

  async create(payload: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const { data } = await api.post<ApiResponse<MedicalRecord>>(
      '/medical-records',
      payload,
    );
    return data.data;
  },

  async getById(id: number): Promise<MedicalRecord> {
    const { data } = await api.get<ApiResponse<MedicalRecord>>(
      `/medical-records/${id}`,
    );
    return data.data;
  },

  async update(id: number, payload: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const { data } = await api.put<ApiResponse<MedicalRecord>>(
      `/medical-records/${id}`,
      payload,
    );
    return data.data;
  },

  async addPrescriptions(
    id: number,
    items: Partial<Prescription>[],
  ): Promise<Prescription[]> {
    const { data } = await api.post<ApiResponse<Prescription[]>>(
      `/medical-records/${id}/prescriptions`,
      { items },
    );
    return data.data;
  },
};
