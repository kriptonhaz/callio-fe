import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Lead, CreateLeadRequest, UpdateLeadRequest, LeadsQueryParams } from '@/lib/api/types/leads.types';

export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (params: LeadsQueryParams) => [...leadsKeys.lists(), params] as const,
  details: () => [...leadsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
};

const leadsApi = {
  getAll: async (params: LeadsQueryParams): Promise<PaginatedResponse<Lead>> => {
    const queryString = buildQueryString(params);
    return await apiClient.get(`leads${queryString}`).json<PaginatedResponse<Lead>>();
  },

  getById: async (id: string): Promise<Lead> => {
    return await apiClient.get(`leads/${id}`).json<Lead>();
  },

  create: async (data: CreateLeadRequest): Promise<Lead> => {
    return await apiClient.post('leads', { json: data }).json<Lead>();
  },

  update: async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    return await apiClient.patch(`leads/${id}`, { json: data }).json<Lead>();
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`leads/${id}`);
  },
};

export const useLeads = (params: LeadsQueryParams = {}): UseQueryResult<PaginatedResponse<Lead>, Error> => {
  return useQuery({
    queryKey: leadsKeys.list(params),
    queryFn: () => leadsApi.getAll(params),
    staleTime: 30 * 1000,
  });
};

export const useLead = (id: string): UseQueryResult<Lead, Error> => {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

export const useCreateLead = (): UseMutationResult<Lead, Error, CreateLeadRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
};

export const useUpdateLead = (): UseMutationResult<Lead, Error, { id: string; data: UpdateLeadRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leadsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      queryClient.setQueryData(leadsKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteLead = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      queryClient.removeQueries({ queryKey: leadsKeys.detail(id) });
    },
  });
};
