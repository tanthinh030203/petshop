import api from './api';
import type { ApiResponse } from '@/types';

export interface RevenueReport {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  by_date: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

export interface TopProductReport {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface TopServiceReport {
  service_id: number;
  service_name: string;
  total_count: number;
  total_revenue: number;
}

export interface CustomerStatsReport {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  by_date: Array<{
    date: string;
    new_count: number;
    returning_count: number;
  }>;
}

export interface AppointmentStatsReport {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_date: Array<{
    date: string;
    count: number;
  }>;
}

export interface StockAlert {
  branch_id: number;
  branch_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  min_quantity: number;
}

export const reportService = {
  async getRevenue(params: Record<string, unknown>): Promise<RevenueReport> {
    const { data } = await api.get<ApiResponse<RevenueReport>>('/reports/revenue', {
      params,
    });
    return data.data;
  },

  async getTopProducts(params: Record<string, unknown>): Promise<TopProductReport[]> {
    const { data } = await api.get<ApiResponse<TopProductReport[]>>(
      '/reports/top-products',
      { params },
    );
    return data.data;
  },

  async getTopServices(params: Record<string, unknown>): Promise<TopServiceReport[]> {
    const { data } = await api.get<ApiResponse<TopServiceReport[]>>(
      '/reports/top-services',
      { params },
    );
    return data.data;
  },

  async getCustomerStats(
    params: Record<string, unknown>,
  ): Promise<CustomerStatsReport> {
    const { data } = await api.get<ApiResponse<CustomerStatsReport>>(
      '/reports/customer-stats',
      { params },
    );
    return data.data;
  },

  async getAppointmentStats(
    params: Record<string, unknown>,
  ): Promise<AppointmentStatsReport> {
    const { data } = await api.get<ApiResponse<AppointmentStatsReport>>(
      '/reports/appointment-stats',
      { params },
    );
    return data.data;
  },

  async getStockAlerts(): Promise<StockAlert[]> {
    const { data } = await api.get<ApiResponse<StockAlert[]>>(
      '/reports/stock-alerts',
    );
    return data.data;
  },
};
