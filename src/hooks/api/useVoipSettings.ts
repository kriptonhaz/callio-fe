import {
  
  
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type {
  UpsertVoipSettingsRequest,
  VoipSettings,
} from '@/lib/api/types/voip-settings.types'
import { apiClient } from '@/lib/api/client'

export const voipSettingsKeys = {
  all: ['voip-settings'] as const,
}

const voipSettingsApi = {
  get: async (): Promise<VoipSettings> =>
    await apiClient.get('voip-settings').json<VoipSettings>(),

  upsert: async (data: UpsertVoipSettingsRequest): Promise<VoipSettings> =>
    await apiClient.put('voip-settings', { json: data }).json<VoipSettings>(),
}

export const useVoipSettings = (): UseQueryResult<VoipSettings, Error> =>
  useQuery({
    queryKey: voipSettingsKeys.all,
    queryFn: voipSettingsApi.get,
    staleTime: 5 * 60 * 1000,
  })

export const useUpsertVoipSettings = (): UseMutationResult<
  VoipSettings,
  Error,
  UpsertVoipSettingsRequest
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: voipSettingsApi.upsert,
    onSuccess: (data) => {
      qc.setQueryData(voipSettingsKeys.all, data)
    },
  })
}
