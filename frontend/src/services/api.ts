// API Service - centralized HTTP client with JWT token injection, automatic token refresh on 401, and API method wrappers
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  PaymentListResponse,
  Payment,
  SummaryReport,
  TimeSeriesData,
  FilterOptions,
  PlatformStats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Prevent infinite retry loops
        if (error.config && (error.config as any).__retryCount) {
          (error.config as any).__retryCount++;
          if ((error.config as any).__retryCount > 2) {
            return Promise.reject(error);
          }
        } else if (error.config) {
          (error.config as any).__retryCount = 1;
        }

        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { access_token } = response.data;
              localStorage.setItem('access_token', access_token);
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async getSummaryReport(filters?: {
    school_id?: string;
    student_id?: string;
    from?: string;
    to?: string;
    method?: string;
    period_months?: number;
  }): Promise<SummaryReport> {
    const response = await this.client.get<SummaryReport>('/reports/summary', {
      params: filters,
    });
    return response.data;
  }

  async getTimeSeries(filters?: {
    school_id?: string;
    student_id?: string;
    from?: string;
    to?: string;
    method?: string;
    interval?: 'day' | 'week' | 'month';
    period_months?: number;
  }): Promise<TimeSeriesData> {
    const response = await this.client.get<TimeSeriesData>('/reports/time-series', {
      params: filters,
    });
    return response.data;
  }

  async getPayments(filters?: FilterOptions): Promise<PaymentListResponse> {
    const response = await this.client.get<PaymentListResponse>('/payments', {
      params: filters,
    });
    return response.data;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await this.client.get<Payment>(`/payments/${id}`);
    return response.data;
  }

  async getStudentReport(studentId: string) {
    const response = await this.client.get(`/reports/student/${studentId}`);
    return response.data;
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const response = await this.client.get<PlatformStats>('/reports/platform-stats');
    return response.data;
  }
}

export const apiService = new ApiService();
