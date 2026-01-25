import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { whatsappAnalyticsApi } from '@/lib/api/whatsapp-analytics'
import type {
  WhatsAppAnalytics,
  StartWhatsAppAnalyticsRequest,
  StartWhatsAppAnalyticsResponse,
  WhatsAppTimelineResponse,
  WhatsAppTimelineParams,
} from '@/lib/api/types/whatsapp-analytics.types'

// Query keys
export const whatsappAnalyticsKeys = {
  all: ['whatsappAnalytics'] as const,
  detail: (campaignId: string) =>
    [...whatsappAnalyticsKeys.all, campaignId] as const,
}

// Get WhatsApp analytics for campaign
export const useWhatsAppAnalytics = (
  campaignId: string,
  options?: { refetchInterval?: number | false; enabled?: boolean },
): UseQueryResult<WhatsAppAnalytics | null, Error> => {
  return useQuery({
    queryKey: whatsappAnalyticsKeys.detail(campaignId),
    queryFn: () => whatsappAnalyticsApi.get(campaignId),
    enabled: options?.enabled !== false && !!campaignId,
    refetchInterval: options?.refetchInterval,
  })
}

// Start WhatsApp analytics processing
export const useStartWhatsAppAnalytics = (): UseMutationResult<
  StartWhatsAppAnalyticsResponse,
  Error,
  { campaignId: string; data: StartWhatsAppAnalyticsRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, data }) =>
      whatsappAnalyticsApi.start(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: whatsappAnalyticsKeys.detail(variables.campaignId),
      })
    },
  })
}

// Get WhatsApp timeline analytics
export const useWhatsAppTimeline = (
  campaignId: string,
  params: WhatsAppTimelineParams = { period: 'hourly' },
): UseQueryResult<WhatsAppTimelineResponse, Error> => {
  return useQuery({
    queryKey: [...whatsappAnalyticsKeys.detail(campaignId), 'timeline', params],
    queryFn: () => whatsappAnalyticsApi.getTimeline(campaignId, params),
    enabled: !!campaignId,
  })
}
