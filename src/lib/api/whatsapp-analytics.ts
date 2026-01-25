import { apiClient } from './client'
import type {
  WhatsAppAnalytics,
  StartWhatsAppAnalyticsRequest,
  StartWhatsAppAnalyticsResponse,
  WhatsAppTimelineResponse,
  WhatsAppTimelineParams,
} from './types/whatsapp-analytics.types'

export const whatsappAnalyticsApi = {
  // Get WhatsApp analytics for campaign
  get: async (campaignId: string): Promise<WhatsAppAnalytics | null> => {
    try {
      return await apiClient
        .get(`campaigns/${campaignId}/analytics/whatsapp`)
        .json<WhatsAppAnalytics>()
    } catch (error: unknown) {
      // Return null if no analytics found (404)
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number } }
        if (err.response?.status === 404) {
          return null
        }
      }
      throw error
    }
  },

  // Start WhatsApp analytics processing
  start: async (
    campaignId: string,
    data: StartWhatsAppAnalyticsRequest,
  ): Promise<StartWhatsAppAnalyticsResponse> => {
    return apiClient
      .post(`campaigns/${campaignId}/analytics/whatsapp/start`, { json: data })
      .json<StartWhatsAppAnalyticsResponse>()
  },

  // Get WhatsApp timeline analytics
  getTimeline: async (
    campaignId: string,
    params: WhatsAppTimelineParams = { period: 'hourly' },
  ): Promise<WhatsAppTimelineResponse> => {
    return apiClient
      .get(`campaigns/${campaignId}/analytics/whatsapp/timeline`, {
        searchParams: params as any,
      })
      .json<WhatsAppTimelineResponse>()
  },
}
