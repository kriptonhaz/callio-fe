import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { SystemInfoResponse } from '@/lib/api/types/system-info.types'

export const systemInfoKeys = {
  all: ['system-info'] as const,
  detail: () => [...systemInfoKeys.all, 'detail'] as const,
}

const systemInfoApi = {
  get: async (): Promise<SystemInfoResponse> => {
    return await apiClient.get('system-info').json<SystemInfoResponse>()
  },
}

export const useSystemInfo = (): UseQueryResult<SystemInfoResponse, Error> => {
  return useQuery({
    queryKey: systemInfoKeys.detail(),
    queryFn: systemInfoApi.get,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  })
}
