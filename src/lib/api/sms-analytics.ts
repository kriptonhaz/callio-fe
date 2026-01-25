import { apiClient } from './client'
import type { SmsAnalytics } from './types/sms-analytics.types'

export const smsAnalyticsApi = {
  // Get SMS analytics for campaign
  get: async (campaignId: string): Promise<SmsAnalytics | null> => {
    try {
      return await apiClient
        .get(`campaigns/${campaignId}/analytics/sms`)
        .json<SmsAnalytics>()
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
