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
  LeadAssignment,
  LeadAssignmentsQueryParams,
  UpdateLeadAssignmentRequest,
} from '@/lib/api/types/lead-assignments.types'

export const leadAssignmentsKeys = {
  all: ['lead-assignments'] as const,
  lists: () => [...leadAssignmentsKeys.all, 'list'] as const,
  list: (params: LeadAssignmentsQueryParams) =>
    [...leadAssignmentsKeys.lists(), params] as const,
  details: () => [...leadAssignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadAssignmentsKeys.details(), id] as const,
}

const leadAssignmentsApi = {
  getAll: async (
    params: LeadAssignmentsQueryParams,
  ): Promise<PaginatedResponse<LeadAssignment>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`lead-assignments${queryString}`)
      .json<PaginatedResponse<LeadAssignment>>()
  },

  update: async (
    id: string,
    data: UpdateLeadAssignmentRequest,
  ): Promise<LeadAssignment> => {
    return await apiClient
      .patch(`lead-assignments/${id}`, { json: data })
      .json<LeadAssignment>()
  },
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
