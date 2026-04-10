import api from './api';
import type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  PaginatedResponse,
} from '@/types';

export const appointmentService = {
  async getAll(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Appointment>> {
    const { data } = await api.get<PaginatedResponse<Appointment>>('/appointments', {
      params,
    });
    return data;
  },

  async getById(id: number): Promise<Appointment> {
    const { data } = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return data.data;
  },

  async create(payload: Partial<Appointment>): Promise<Appointment> {
    const { data } = await api.post<ApiResponse<Appointment>>(
      '/appointments',
      payload,
    );
    return data.data;
  },

  async update(id: number, payload: Partial<Appointment>): Promise<Appointment> {
    const { data } = await api.put<ApiResponse<Appointment>>(
      `/appointments/${id}`,
      payload,
    );
    return data.data;
  },

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    const { data } = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      { status },
    );
    return data.data;
  },

  async getCalendar(
    params?: Record<string, unknown>,
  ): Promise<Appointment[]> {
    const { data } = await api.get<ApiResponse<Appointment[]>>(
      '/appointments/calendar',
      { params },
    );
    return data.data;
  },
};
