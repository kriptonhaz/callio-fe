import {
  
  
  useMutation,
  useQuery
} from '@tanstack/react-query'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  PerformanceLeadRow,
  PerformanceListParams,
} from '@/lib/api/types/performance.types'
import { apiClient, buildQueryString } from '@/lib/api/client'

export const performanceKeys = {
  all: ['performance'] as const,
  list: (params: PerformanceListParams) =>
    [...performanceKeys.all, 'list', params] as const,
}

const api = {
  list: async (
    params: PerformanceListParams,
  ): Promise<PaginatedResponse<PerformanceLeadRow>> => {
    const qs = buildQueryString(params)
    return await apiClient
      .get(`lead-assignments/performance${qs}`)
      .json<PaginatedResponse<PerformanceLeadRow>>()
  },

  exportLeads: async (
    params: Omit<PerformanceListParams, 'page' | 'limit'>,
  ): Promise<Blob> => {
    const qs = buildQueryString(params)
    const response = await apiClient.get(
      `lead-assignments/performance/export${qs}`,
    )
    return response.blob()
  },
}

export const usePerformanceLeads = (
  params: PerformanceListParams,
): UseQueryResult<PaginatedResponse<PerformanceLeadRow>, Error> =>
  useQuery({
    queryKey: performanceKeys.list(params),
    queryFn: () => api.list(params),
    staleTime: 30 * 1000,
  })

export const useExportPerformanceLeadsCsv = (): UseMutationResult<
  Blob,
  Error,
  Omit<PerformanceListParams, 'page' | 'limit'>
> =>
  useMutation({
    mutationFn: api.exportLeads,
  })
