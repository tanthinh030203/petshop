import api from './api';
import type { ApiResponse, HotelBooking, PaginatedResponse } from '@/types';

export const hotelService = {
  async getAll(
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<HotelBooking>> {
    const { data } = await api.get<PaginatedResponse<HotelBooking>>('/hotel-bookings', {
      params,
    });
    return data;
  },

  async create(payload: Partial<HotelBooking>): Promise<HotelBooking> {
    const { data } = await api.post<ApiResponse<HotelBooking>>(
      '/hotel-bookings',
      payload,
    );
    return data.data;
  },

  async checkIn(id: number): Promise<HotelBooking> {
    const { data } = await api.patch<ApiResponse<HotelBooking>>(
      `/hotel-bookings/${id}/check-in`,
    );
    return data.data;
  },

  async checkOut(id: number): Promise<HotelBooking> {
    const { data } = await api.patch<ApiResponse<HotelBooking>>(
      `/hotel-bookings/${id}/check-out`,
    );
    return data.data;
  },
};
