import { apiClient } from './client'
import type { VoipAnalytics } from './types/voip-analytics.types'

export const voipAnalyticsApi = {
  // Get VoIP analytics for campaign
  get: async (campaignId: string): Promise<VoipAnalytics | null> => {
    try {
      return await apiClient
        .get(`campaigns/${campaignId}/analytics/voip`)
        .json<VoipAnalytics>()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number } }
        if (err.response?.status === 404) {
          return null
        }
      }
      throw error
    }
  },
}
