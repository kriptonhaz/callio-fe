import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import { campaignsKeys } from './useCampaigns'
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  LeadAssignment,
  LeadAssignmentsQueryParams,
  UpdateLeadAssignmentRequest,
} from '@/lib/api/types/lead-assignments.types'
import type {
  LeadAssignmentAnalyticsParams,
  LeadAssignmentAnalyticsResponse,
} from '@/lib/api/types/lead-assignment-analytics.types'

export const leadAssignmentsKeys = {
  all: ['lead-assignments'] as const,
  lists: () => [...leadAssignmentsKeys.all, 'list'] as const,
  list: (params: LeadAssignmentsQueryParams) =>
    [...leadAssignmentsKeys.lists(), params] as const,
  details: () => [...leadAssignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadAssignmentsKeys.details(), id] as const,
  analytics: (params: LeadAssignmentAnalyticsParams) =>
    [...leadAssignmentsKeys.all, 'analytics', params] as const,
}

const getAll = async (
  params: LeadAssignmentsQueryParams,
): Promise<PaginatedResponse<LeadAssignment>> => {
  const queryString = buildQueryString(params)
  return await apiClient
    .get(`lead-assignments${queryString}`)
    .json<PaginatedResponse<LeadAssignment>>()
}

const getById = async (id: string): Promise<LeadAssignment> => {
  return await apiClient.get(`lead-assignments/${id}`).json<LeadAssignment>()
}

const update = async (
  id: string,
  data: UpdateLeadAssignmentRequest,
): Promise<LeadAssignment> => {
  return await apiClient
    .patch(`lead-assignments/${id}`, { json: data })
    .json<LeadAssignment>()
}

const deleteLead = async (id: string): Promise<void> => {
  await apiClient.delete(`lead-assignments/${id}`)
}

const bulkAssignLeads = async (data: {
  campaignId: string
  leadIds: string[]
}): Promise<{ assigned: number }> => {
  return apiClient
    .post('lead-assignments/bulk-assign', {
      json: {
        campaignId: data.campaignId,
        leadIds: data.leadIds,
      },
    })
    .json()
}

const bulkUnassignLeads = async (data: {
  campaignId: string
  leadIds: string[]
}): Promise<{
  unassigned: number
  failed: number
  errors: Array<{ leadId: string; error: string }>
}> => {
  return apiClient
    .post('lead-assignments/bulk-unassign', {
      json: {
        campaignId: data.campaignId,
        leadIds: data.leadIds,
      },
    })
    .json()
}

const getAnalytics = async (
  params: LeadAssignmentAnalyticsParams,
): Promise<LeadAssignmentAnalyticsResponse> => {
  const queryString = buildQueryString(params)
  return await apiClient
    .get(`lead-assignments/analytics${queryString}`)
    .json<LeadAssignmentAnalyticsResponse>()
}

export const leadAssignmentsApi = {
  getAll,
  getById,
  update,
  delete: deleteLead,
  bulkAssign: bulkAssignLeads,
  bulkUnassign: bulkUnassignLeads,
  getAnalytics,
}

export const useLeadAssignments = (
  params: LeadAssignmentsQueryParams,
): UseQueryResult<PaginatedResponse<LeadAssignment>, Error> => {
  return useQuery({
    queryKey: leadAssignmentsKeys.list(params),
    queryFn: () => leadAssignmentsApi.getAll(params),
    enabled: !!params.campaignId,
    staleTime: 30 * 1000,
  })
}

export const useLeadAssignment = (
  id: string | undefined,
  options?: { refetchInterval?: number | false },
): UseQueryResult<LeadAssignment, Error> => {
  return useQuery({
    queryKey: leadAssignmentsKeys.detail(id ?? ''),
    queryFn: () => leadAssignmentsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 1000,
    refetchInterval: options?.refetchInterval,
  })
}

export const useUpdateLeadAssignment = (): UseMutationResult<
  LeadAssignment,
  Error,
  { id: string; data: UpdateLeadAssignmentRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => leadAssignmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() })
    },
  })
}

export const useDeleteLeadAssignment = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadAssignmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() })
      // Invalidate leads queries to refresh unassigned leads list
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      // Invalidate campaigns to refresh lead counts
      queryClient.invalidateQueries({ queryKey: campaignsKeys.all })
    },
  })
}

export const useBulkAssignLeads = (): UseMutationResult<
  { assigned: number },
  Error,
  { campaignId: string; leadIds: string[] }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadAssignmentsApi.bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      // Invalidate campaigns to refresh lead counts
      queryClient.invalidateQueries({ queryKey: campaignsKeys.all })
    },
  })
}

export const useBulkUnassignLeads = (): UseMutationResult<
  {
    unassigned: number
    failed: number
    errors: Array<{ leadId: string; error: string }>
  },
  Error,
  { campaignId: string; leadIds: string[] }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadAssignmentsApi.bulkUnassign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      // Invalidate campaigns to refresh lead counts
      queryClient.invalidateQueries({ queryKey: campaignsKeys.all })
    },
  })
}

export const useLeadAssignmentAnalytics = (
  params: LeadAssignmentAnalyticsParams,
  enabled = true,
): UseQueryResult<LeadAssignmentAnalyticsResponse, Error> => {
  return useQuery({
    queryKey: leadAssignmentsKeys.analytics(params),
    queryFn: () => leadAssignmentsApi.getAnalytics(params),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
