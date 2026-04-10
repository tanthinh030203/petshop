import api from './api';
import type {
  ApiResponse,
  Invoice,
  InvoiceStatus,
  Payment,
  PaginatedResponse,
} from '@/types';

export const invoiceService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Invoice>> {
    const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params });
    return data;
  },

  async getById(id: number): Promise<Invoice> {
    const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data.data;
  },

  async create(payload: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.post<ApiResponse<Invoice>>('/invoices', payload);
    return data.data;
  },

  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const { data } = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, {
      status,
    });
    return data.data;
  },

  async addPayment(id: number, payload: Partial<Payment>): Promise<Payment> {
    const { data } = await api.post<ApiResponse<Payment>>(
      `/invoices/${id}/payments`,
      payload,
    );
    return data.data;
  },
};
