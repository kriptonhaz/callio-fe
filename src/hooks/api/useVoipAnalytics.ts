import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { voipAnalyticsApi } from '@/lib/api/voip-analytics'
import type { VoipAnalytics } from '@/lib/api/types/voip-analytics.types'

export const voipAnalyticsKeys = {
  all: ['voipAnalytics'] as const,
  detail: (campaignId: string) =>
    [...voipAnalyticsKeys.all, campaignId] as const,
}

export const useVoipAnalytics = (
  campaignId: string,
): UseQueryResult<VoipAnalytics | null, Error> => {
  return useQuery({
    queryKey: voipAnalyticsKeys.detail(campaignId),
    queryFn: () => voipAnalyticsApi.get(campaignId),
    enabled: !!campaignId,
  })
}
