import api from './api';
import type {
  ApiResponse,
  Pet,
  MedicalRecord,
  Vaccination,
  Appointment,
  PaginatedResponse,
} from '@/types';

export const petService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Pet>> {
    const { data } = await api.get<PaginatedResponse<Pet>>('/pets', { params });
    return data;
  },

  async getById(id: number): Promise<Pet> {
    const { data } = await api.get<ApiResponse<Pet>>(`/pets/${id}`);
    return data.data;
  },

  async create(payload: Partial<Pet>): Promise<Pet> {
    const { data } = await api.post<ApiResponse<Pet>>('/pets', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<Pet>): Promise<Pet> {
    const { data } = await api.put<ApiResponse<Pet>>(`/pets/${id}`, payload);
    return data.data;
  },

  async getMedicalRecords(id: number): Promise<MedicalRecord[]> {
    const { data } = await api.get<ApiResponse<MedicalRecord[]>>(
      `/pets/${id}/medical-records`,
    );
    return data.data;
  },

  async getVaccinations(id: number): Promise<Vaccination[]> {
    const { data } = await api.get<ApiResponse<Vaccination[]>>(
      `/pets/${id}/vaccinations`,
    );
    return data.data;
  },

  async getAppointments(id: number): Promise<Appointment[]> {
    const { data } = await api.get<ApiResponse<Appointment[]>>(
      `/pets/${id}/appointments`,
    );
    return data.data;
  },
};
