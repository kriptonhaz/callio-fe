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
      async (request, _options, response) => {
        // Handle 401 Unauthorized - clear tokens and redirect to login
        // Don't redirect if the error comes from the login endpoint itself
        if (response.status === 401 && !request.url.includes('/auth/login')) {
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
// Error handler helper
export const handleApiError = async (error: unknown): Promise<never> => {
  // Check if it's a ky HTTPError
  if (error instanceof Error && error.name === 'HTTPError' && 'response' in error) {
    const response = (error as any).response as Response;
    
    try {
      // Clone the response to avoid "body used" errors if it was already read
      const clonedResponse = response.clone();
      const errorData: ApiError = await clonedResponse.json();
      
      throw new Error(
        Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || errorData.error || 'Unknown API Error'
      );
    } catch (e) {
      // If we successfully parsed the error above, re-throw it
      if (e instanceof Error && e.message !== 'Body is unusable') {
        // If the error message is one we just created, throw it
        if (e.message !== `API Error: ${response.status} ${response.statusText}`) {
          throw e;
        }
      }
      
      // Fallback to status text
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    throw error;
  }
  
  throw new Error('An unexpected error occurred');
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
