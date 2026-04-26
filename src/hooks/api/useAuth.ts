import {
  
  
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { notificationsKeys } from './useNotifications'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/lib/api/types/auth.types'
import {
  apiClient,
  clearTokens,
  handleApiError,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api/client'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// API functions
const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient
        .post('auth/login', { json: data })
        .json<AuthResponse>()
      return response
    } catch (error) {
      return handleApiError(error)
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient
        .post('auth/register', { json: data })
        .json<AuthResponse>()
      return response
    } catch (error) {
      return handleApiError(error)
    }
  },

  me: async (): Promise<User> => {
    try {
      const response = await apiClient.get('auth/me').json<User>()
      return response
    } catch (error) {
      return handleApiError(error)
    }
  },
}

// Hooks

/**
 * Login mutation hook
 * Automatically stores tokens on successful login
 */
export const useLogin = (): UseMutationResult<
  AuthResponse,
  Error,
  LoginRequest
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store tokens
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)

      // Set user data in cache
      queryClient.setQueryData(authKeys.me(), data.user)
    },
  })
}

/**
 * Register mutation hook
 * Automatically stores tokens on successful registration
 */
export const useRegister = (): UseMutationResult<
  AuthResponse,
  Error,
  RegisterRequest
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Store tokens
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)

      // Set user data in cache
      queryClient.setQueryData(authKeys.me(), data.user)
    },
  })
}

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
  })
}

/**
 * Logout helper hook
 * Clears tokens and invalidates all queries
 */
export const useLogout = () => {
  const queryClient = useQueryClient()

  return () => {
    // Clear tokens
    clearTokens()

    // Clear all cached data
    queryClient.clear()

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

/**
 * Forgot password mutation hook
 * Sends password reset email to the user
 */
export const useForgotPassword = (): UseMutationResult<
  ForgotPasswordResponse,
  Error,
  ForgotPasswordRequest
> => {
  return useMutation({
    mutationFn: async (
      data: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      try {
        const response = await apiClient
          .post('auth/forgot-password', { json: data })
          .json<ForgotPasswordResponse>()
        return response
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  message: string
}

/**
 * Reset password mutation hook
 * Resets the user's password using the token from email
 */
export const useResetPassword = (): UseMutationResult<
  ResetPasswordResponse,
  Error,
  ResetPasswordRequest
> => {
  return useMutation({
    mutationFn: async (
      data: ResetPasswordRequest,
    ): Promise<ResetPasswordResponse> => {
      try {
        const response = await apiClient
          .post('auth/reset-password', { json: data })
          .json<ResetPasswordResponse>()
        return response
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  message: string
}

/**
 * Change password mutation hook
 * For authenticated users to update their own password.
 */
export const useChangePassword = (): UseMutationResult<
  ChangePasswordResponse,
  Error,
  ChangePasswordRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: ChangePasswordRequest,
    ): Promise<ChangePasswordResponse> => {
      try {
        const response = await apiClient
          .post('auth/change-password', { json: data })
          .json<ChangePasswordResponse>()
        return response
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      // Backend creates a "Password Changed" notification — refresh the bell.
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() })
    },
  })
}
