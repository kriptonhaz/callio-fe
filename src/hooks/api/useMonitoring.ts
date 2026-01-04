import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type {
  RegisteredAgentsResponse,
  ActiveCallsResponse,
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
    refetchInterval: 5000, // Poll every 5 seconds for active calls
    staleTime: 2000,
  })
}
