import ky, { type KyInstance } from 'ky';
import type { ApiError } from './types';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Token management
const TOKEN_KEY = 'callio_access_token';
const REFRESH_TOKEN_KEY = 'callio_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create ky instance with default configuration
export const apiClient: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Add JWT token to all requests
        const token = getAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        
        // Ensure JSON content type for non-GET requests
        if (request.method !== 'GET' && !request.headers.has('Content-Type')) {
          request.headers.set('Content-Type', 'application/json');
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // Handle 401 Unauthorized - clear tokens and redirect to login
        if (response.status === 401) {
          clearTokens();
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        
        return response;
      },
    ],
  },
});

// Error handler helper
export const handleApiError = async (error: unknown): Promise<never> => {
  if (error instanceof Error && 'response' in error) {
    const response = (error as any).response;
    
    if (response) {
      try {
        const errorData: ApiError = await response.json();
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message
        );
      } catch {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }
  }
  
  throw error;
};

// Helper function to build query string from params
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};
