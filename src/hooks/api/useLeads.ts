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
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadsQueryParams,
} from '@/lib/api/types/leads.types'

export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (params: LeadsQueryParams) => [...leadsKeys.lists(), params] as const,
  details: () => [...leadsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
}

const leadsApi = {
  getAll: async (
    params: LeadsQueryParams,
  ): Promise<PaginatedResponse<Lead>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`leads${queryString}`)
      .json<PaginatedResponse<Lead>>()
  },

  getById: async (id: string): Promise<Lead> => {
    return await apiClient.get(`leads/${id}`).json<Lead>()
  },

  getUnassignedForCampaign: async (
    campaignId: string,
    params: Omit<LeadsQueryParams, 'campaignId'>,
  ): Promise<PaginatedResponse<Lead>> => {
    const queryString = buildQueryString(params)
    return apiClient
      .get(`leads/unassigned/${campaignId}${queryString}`)
      .json<PaginatedResponse<Lead>>()
  },

  create: async (data: CreateLeadRequest): Promise<Lead> => {
    return await apiClient.post('leads', { json: data }).json<Lead>()
  },

  update: async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    return await apiClient.patch(`leads/${id}`, { json: data }).json<Lead>()
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`leads/${id}`)
  },

  bulkImport: async (
    formData: FormData,
  ): Promise<{ imported: number; skipped: number }> => {
    return await apiClient
      .post('leads/bulk-import', { body: formData })
      .json<{ imported: number; skipped: number }>()
  },

  downloadSampleCsv: async (): Promise<Blob> => {
    return await apiClient.get('leads/sample-csv').blob()
  },
}

export const useLeads = (
  params: LeadsQueryParams = {},
): UseQueryResult<PaginatedResponse<Lead>, Error> => {
  return useQuery({
    queryKey: leadsKeys.list(params),
    queryFn: () => leadsApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

export const useLead = (id: string): UseQueryResult<Lead, Error> => {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export const useUnassignedLeads = (
  campaignId: string,
  params: Omit<LeadsQueryParams, 'campaignId'>,
): UseQueryResult<PaginatedResponse<Lead>, Error> => {
  return useQuery({
    queryKey: [...leadsKeys.lists(), 'unassigned', campaignId, params],
    queryFn: () => leadsApi.getUnassignedForCampaign(campaignId, params),
    enabled: !!campaignId,
    staleTime: 30 * 1000,
  })
}

export const useCreateLead = (): UseMutationResult<
  Lead,
  Error,
  CreateLeadRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() })
      // Invalidate lead-assignments to refresh campaign leads table
      queryClient.invalidateQueries({ queryKey: ['lead-assignments'] })
    },
  })
}

export const useUpdateLead = (): UseMutationResult<
  Lead,
  Error,
  { id: string; data: UpdateLeadRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => leadsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() })
      queryClient.setQueryData(leadsKeys.detail(variables.id), data)
    },
  })
}

export const useDeleteLead = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() })
      queryClient.removeQueries({ queryKey: leadsKeys.detail(id) })
      // Invalidate lead-assignments to refresh campaign leads table
      queryClient.invalidateQueries({ queryKey: ['lead-assignments'] })
    },
  })
}

export const useBulkImportLeads = (): UseMutationResult<
  { imported: number; skipped: number },
  Error,
  FormData
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadsApi.bulkImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() })
      // Also invalidate lead-assignments to refresh the campaign leads table
      queryClient.invalidateQueries({ queryKey: ['lead-assignments'] })
    },
  })
}

export const useDownloadSampleCsv = () => {
  return useMutation({
    mutationFn: leadsApi.downloadSampleCsv,
  })
}
