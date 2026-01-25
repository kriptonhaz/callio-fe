import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignsQueryParams,
} from '@/lib/api/types/campaigns.types'

export const campaignsKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignsKeys.all, 'list'] as const,
  list: (params: CampaignsQueryParams) =>
    [...campaignsKeys.lists(), params] as const,
  details: () => [...campaignsKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignsKeys.details(), id] as const,
}

const campaignsApi = {
  getAll: async (
    params: CampaignsQueryParams,
  ): Promise<PaginatedResponse<Campaign>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`campaigns${queryString}`)
      .json<PaginatedResponse<Campaign>>()
  },

  getById: async (id: string): Promise<Campaign> => {
    return await apiClient.get(`campaigns/${id}`).json<Campaign>()
  },

  create: async (data: CreateCampaignRequest): Promise<Campaign> => {
    return await apiClient.post('campaigns', { json: data }).json<Campaign>()
  },

  update: async (
    id: string,
    data: UpdateCampaignRequest,
  ): Promise<Campaign> => {
    return await apiClient
      .patch(`campaigns/${id}`, { json: data })
      .json<Campaign>()
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`campaigns/${id}`)
  },

  exportAnalytics: async (id: string): Promise<Blob> => {
    return await apiClient.get(`campaigns/${id}/analytics/export`).blob()
  },
}

export const useCampaigns = (
  params: CampaignsQueryParams = {},
): UseQueryResult<PaginatedResponse<Campaign>, Error> => {
  return useQuery({
    queryKey: campaignsKeys.list(params),
    queryFn: () => campaignsApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

export const useCampaign = (id: string): UseQueryResult<Campaign, Error> => {
  return useQuery({
    queryKey: campaignsKeys.detail(id),
    queryFn: () => campaignsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export const useCreateCampaign = (): UseMutationResult<
  Campaign,
  Error,
  CreateCampaignRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() })
    },
  })
}

export const useUpdateCampaign = (): UseMutationResult<
  Campaign,
  Error,
  { id: string; data: UpdateCampaignRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => campaignsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: campaignsKeys.detail(variables.id),
      })
    },
  })
}

export const useDeleteCampaign = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() })
      queryClient.removeQueries({ queryKey: campaignsKeys.detail(id) })
    },
  })
}

export const useExportCampaignAnalytics = (): UseMutationResult<
  Blob,
  Error,
  string
> => {
  return useMutation({
    mutationFn: campaignsApi.exportAnalytics,
  })
}
