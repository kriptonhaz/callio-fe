import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { SipConnectionStatusResponse } from '@/lib/api/types/sip-status.types'

export const sipStatusKeys = {
  all: ['sip-status'] as const,
  connection: () => [...sipStatusKeys.all, 'connection'] as const,
}

const sipStatusApi = {
  getConnectionStatus: async (): Promise<SipConnectionStatusResponse> => {
    return await apiClient
      .get('sip/connection-status')
      .json<SipConnectionStatusResponse>()
  },
}

export const useSipConnectionStatus = (enabled: boolean = true) => {
  return useQuery({
    queryKey: sipStatusKeys.connection(),
    queryFn: sipStatusApi.getConnectionStatus,
    enabled,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  })
}
