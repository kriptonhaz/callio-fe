import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type {
  SystemLogsResponse,
  SystemLogsQueryParams,
} from '@/lib/api/types/system-logs.types'

export const systemLogsKeys = {
  all: ['system-logs'] as const,
  lists: () => [...systemLogsKeys.all, 'list'] as const,
  list: (params: SystemLogsQueryParams) =>
    [...systemLogsKeys.lists(), params] as const,
}

const systemLogsApi = {
  getAll: async (
    params: SystemLogsQueryParams,
  ): Promise<SystemLogsResponse> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`system-logs${queryString}`)
      .json<SystemLogsResponse>()
  },
  cleanup: async (before: string): Promise<void> => {
    return await apiClient
      .delete('system-logs/cleanup', {
        searchParams: { before },
      })
      .json()
  },
  export: async (): Promise<void> => {
    const response = await apiClient.get('system-logs/export')
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `system-logs-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

export const useSystemLogs = (
  params: SystemLogsQueryParams = {},
): UseQueryResult<SystemLogsResponse, Error> => {
  return useQuery({
    queryKey: systemLogsKeys.list(params),
    queryFn: () => systemLogsApi.getAll(params),
  })
}

export const useCleanupLogs = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: systemLogsApi.cleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemLogsKeys.lists() })
    },
  })
}

export const useExportLogs = () => {
  return useMutation({
    mutationFn: systemLogsApi.export,
  })
}
