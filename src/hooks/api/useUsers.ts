import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, buildQueryString, handleApiError } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type { User, CreateUserRequest, UpdateUserRequest, UsersQueryParams } from '@/lib/api/types/users.types';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersQueryParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

const usersApi = {
  getAll: async (params: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const queryString = buildQueryString(params);
    return await apiClient.get(`users${queryString}`).json<PaginatedResponse<User>>();
  },

  getById: async (id: string): Promise<User> => {
    return await apiClient.get(`users/${id}`).json<User>();
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    return await apiClient.post('users', { json: data }).json<User>();
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return await apiClient.patch(`users/${id}`, { json: data }).json<User>();
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`users/${id}`);
  },

  verify: async (token: string): Promise<void> => {
    try {
      await apiClient.post('users/verify', { json: { token } });
    } catch (error) {
      await handleApiError(error);
    }
  },
};

export const useUsers = (params: UsersQueryParams = {}, enabled: boolean = true): UseQueryResult<PaginatedResponse<User>, Error> => {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.getAll(params),
    staleTime: 30 * 1000,
    enabled: enabled && Object.keys(params).length > 0,
  });
};

export const useUser = (id: string): UseQueryResult<User, Error> => {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

export const useCreateUser = (): UseMutationResult<User, Error, CreateUserRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};

export const useUpdateUser = (): UseMutationResult<User, Error, { id: string; data: UpdateUserRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.setQueryData(usersKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteUser = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.removeQueries({ queryKey: usersKeys.detail(id) });
    },
  });
};

export const useVerifyUser = (): UseMutationResult<void, Error, string> => {
  return useMutation({
    mutationFn: usersApi.verify,
  });
};
