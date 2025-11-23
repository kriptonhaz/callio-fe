import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { apiClient, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api/client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/lib/api/types/auth.types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

import { handleApiError } from '@/lib/api/client';

// API functions
const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('auth/login', { json: data }).json<AuthResponse>();
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('auth/register', { json: data }).json<AuthResponse>();
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  me: async (): Promise<User> => {
    try {
      const response = await apiClient.get('auth/me').json<User>();
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Hooks

/**
 * Login mutation hook
 * Automatically stores tokens on successful login
 */
export const useLogin = (): UseMutationResult<AuthResponse, Error, LoginRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store tokens
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      
      // Set user data in cache
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
};

/**
 * Register mutation hook
 * Automatically stores tokens on successful registration
 */
export const useRegister = (): UseMutationResult<AuthResponse, Error, RegisterRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Store tokens
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      
      // Set user data in cache
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
};

/**
 * Get current user profile
 * Requires authentication token
 */
export const useMe = (): UseQueryResult<User, Error> => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 401
  });
};

/**
 * Logout helper hook
 * Clears tokens and invalidates all queries
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    // Clear tokens
    clearTokens();
    
    // Clear all cached data
    queryClient.clear();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };
};
