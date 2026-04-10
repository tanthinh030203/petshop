import api from './api';
import type {
  ApiResponse,
  Product,
  ProductCategory,
  PaginatedResponse,
} from '@/types';

export const productService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', { params });
    return data;
  },

  async getById(id: number): Promise<Product> {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  async create(payload: Partial<Product>): Promise<Product> {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<Product>): Promise<Product> {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },

  async getCategories(): Promise<ProductCategory[]> {
    const { data } = await api.get<ApiResponse<ProductCategory[]>>(
      '/products/categories',
    );
    return data.data;
  },

  async createCategory(payload: Partial<ProductCategory>): Promise<ProductCategory> {
    const { data } = await api.post<ApiResponse<ProductCategory>>(
      '/products/categories',
      payload,
    );
    return data.data;
  },
};
