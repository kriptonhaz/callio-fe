import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { smsAnalyticsApi } from '@/lib/api/sms-analytics'
import type { SmsAnalytics } from '@/lib/api/types/sms-analytics.types'

export const smsAnalyticsKeys = {
  all: ['smsAnalytics'] as const,
  detail: (campaignId: string) =>
    [...smsAnalyticsKeys.all, campaignId] as const,
}

export const useSmsAnalytics = (
  campaignId: string,
  options?: { enabled?: boolean },
): UseQueryResult<SmsAnalytics | null, Error> => {
  return useQuery({
    queryKey: smsAnalyticsKeys.detail(campaignId),
    queryFn: () => smsAnalyticsApi.get(campaignId),
    enabled: !!campaignId && (options?.enabled ?? true),
  })
}
