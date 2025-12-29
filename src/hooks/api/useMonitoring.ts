import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { RegisteredAgentsResponse } from '@/lib/api/types/monitoring.types'

export const monitoringKeys = {
  all: ['monitoring'] as const,
  agents: () => [...monitoringKeys.all, 'agents'] as const,
}

const monitoringApi = {
  getRegisteredAgents: async (): Promise<RegisteredAgentsResponse> => {
    return await apiClient
      .get('sip/registered-agents')
      .json<RegisteredAgentsResponse>()
  },
}

export const useRegisteredAgents = () => {
  return useQuery({
    queryKey: monitoringKeys.agents(),
    queryFn: monitoringApi.getRegisteredAgents,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  })
}
