import api from './api';
import type { ApiResponse, AuthUser, LoginResponse } from '@/types';

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      username,
      password,
    });
    const result = data.data;
    localStorage.setItem('access_token', result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  async refresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    const { data } = await api.post<
      ApiResponse<{ access_token: string; refresh_token: string }>
    >('/auth/refresh', { refresh_token: refreshToken });
    const result = data.data;
    localStorage.setItem('access_token', result.access_token);
    if (result.refresh_token) {
      localStorage.setItem('refresh_token', result.refresh_token);
    }
    return result.access_token;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
    localStorage.setItem('user', JSON.stringify(data.data));
    return data.data;
  },
};
