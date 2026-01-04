import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type {
  RegisteredAgentsResponse,
  ActiveCallsResponse,
  StartMonitorRequest,
} from '@/lib/api/types/monitoring.types'

export interface MonitoringQueryParams {
  page?: number
  limit?: number
}

export const monitoringKeys = {
  all: ['monitoring'] as const,
  agents: (params?: MonitoringQueryParams) =>
    [...monitoringKeys.all, 'agents', params] as const,
  activeCalls: () => [...monitoringKeys.all, 'active-calls'] as const,
}

const monitoringApi = {
  getRegisteredAgents: async (
    params?: MonitoringQueryParams,
  ): Promise<RegisteredAgentsResponse> => {
    const queryString = buildQueryString(params || {})
    return await apiClient
      .get(`sip/registered-agents${queryString}`)
      .json<RegisteredAgentsResponse>()
  },
  getActiveCalls: async (): Promise<ActiveCallsResponse> => {
    return await apiClient.get('call-logs/active').json<ActiveCallsResponse>()
  },
  startMonitor: async (
    callLogId: string,
    data: StartMonitorRequest,
  ): Promise<void> => {
    await apiClient.post(`call-logs/${callLogId}/monitor`, { json: data })
  },
  stopMonitor: async (callLogId: string): Promise<void> => {
    await apiClient.delete(`call-logs/${callLogId}/monitor`)
  },
}

export const useRegisteredAgents = (params?: MonitoringQueryParams) => {
  return useQuery({
    queryKey: monitoringKeys.agents(params),
    queryFn: () => monitoringApi.getRegisteredAgents(params),
    refetchInterval: 10000,
    staleTime: 5000,
  })
}

export const useActiveCallLogs = () => {
  return useQuery({
    queryKey: monitoringKeys.activeCalls(),
    queryFn: monitoringApi.getActiveCalls,
    refetchInterval: 5000,
    staleTime: 2000,
  })
}

export const useStartCallMonitor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      callLogId,
      data,
    }: {
      callLogId: string
      data: StartMonitorRequest
    }) => monitoringApi.startMonitor(callLogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.activeCalls() })
    },
  })
}

export const useStopCallMonitor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (callLogId: string) => monitoringApi.stopMonitor(callLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.activeCalls() })
    },
  })
}
