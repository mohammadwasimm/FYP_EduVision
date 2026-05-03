import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ENV_CONFIG } from '../../config/env';
import { tokenCookieUtils } from '../../utils/cookies';

export interface ApiErrorData {
  message: string;
  status?: number;
  error?: string; // server error code (e.g. "not_yet_scheduled", "terminated")
  errors?: Record<string, string[]>;
  detail?: string | Array<{
    type?: string;
    loc?: (string | number)[];
    msg?: string;
    message?: string;
    input?: any;
    ctx?: any;
  }>; // FastAPI validation error detail (string or array of error objects)
}

export const createBaseClient = (
  serviceUrl: string,
  defaultHeaders?: Record<string, string>
): AxiosInstance => {
  const client = axios.create({
    baseURL: serviceUrl,
    timeout: ENV_CONFIG.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders,
    },
  });

  // Request interceptor - adds auth token
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenCookieUtils.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      // Handle FormData
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  });

  // Response interceptor - error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<any>) => {
      const status = error.response?.status;
      
      // Handle 401 - token expired or invalid
      if (status === 401) {
        tokenCookieUtils.removeAccessToken();
        window.location.href = '/admin-signin';
      }

      // Error formatting - FastAPI returns 'detail' for validation errors
      // detail can be a string or an array of validation error objects
      let errorMessage = error.message || 'An error occurred';
      const detail = error.response?.data?.detail;
      
      if (detail) {
        if (Array.isArray(detail)) {
          // FastAPI validation errors array format
          // Extract first error message or combine all
          const firstError = detail[0];
          if (firstError?.msg) {
            errorMessage = firstError.msg;
          } else if (firstError?.message) {
            errorMessage = firstError.message;
          } else {
            errorMessage = detail.map((err: any) => err.msg || err.message || 'Validation error').join(', ');
          }
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      const errorData: ApiErrorData = {
        message: errorMessage,
        status,
        error: error.response?.data?.error,
        errors: error.response?.data?.errors,
        detail: detail,
      };

      return Promise.reject(errorData);
    }
  );

  return client;
};
