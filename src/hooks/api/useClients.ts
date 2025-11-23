import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Client, CreateClientRequest, UpdateClientRequest, ClientsQueryParams } from '@/lib/api/types/clients.types';

// Query keys
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (params: ClientsQueryParams) => [...clientsKeys.lists(), params] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
};

// API functions
const clientsApi = {
  getAll: async (params: ClientsQueryParams): Promise<PaginatedResponse<Client>> => {
    const queryString = buildQueryString(params);
    const response = await apiClient.get(`clients${queryString}`).json<PaginatedResponse<Client>>();
    return response;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get(`clients/${id}`).json<Client>();
    return response;
  },

  create: async (data: CreateClientRequest): Promise<Client> => {
    const response = await apiClient.post('clients', { json: data }).json<Client>();
    return response;
  },

  update: async (id: string, data: UpdateClientRequest): Promise<Client> => {
    const response = await apiClient.patch(`clients/${id}`, { json: data }).json<Client>();
    return response;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`clients/${id}`);
  },
};

// Hooks

/**
 * Get paginated list of clients
 */
export const useClients = (params: ClientsQueryParams = {}): UseQueryResult<PaginatedResponse<Client>, Error> => {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => clientsApi.getAll(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Get single client by ID
 */
export const useClient = (id: string): UseQueryResult<Client, Error> => {
  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

/**
 * Create new client
 */
export const useCreateClient = (): UseMutationResult<Client, Error, CreateClientRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      // Invalidate all client lists
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });
};

/**
 * Update existing client
 */
export const useUpdateClient = (): UseMutationResult<Client, Error, { id: string; data: UpdateClientRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => clientsApi.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate lists and update detail cache
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      queryClient.setQueryData(clientsKeys.detail(variables.id), data);
    },
  });
};

/**
 * Delete client
 */
export const useDeleteClient = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: (_, id) => {
      // Invalidate lists and remove from cache
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      queryClient.removeQueries({ queryKey: clientsKeys.detail(id) });
    },
  });
};
