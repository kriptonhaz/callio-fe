export type WhatsAppAnalyticsStatus = 'processing' | 'completed' | 'failed'

export interface SentimentSummary {
  positive_count: number
  negative_count: number
  neutral_count: number
  sentiment_distribution: Record<string, string>
}

export interface TopKeyword {
  keyword: string
  count: number
}

export interface BusinessInsights {
  mostActiveSender: string
  mostCommonCategory: string
  dominantSentiment: string
  frequentlyMentionedProducts: string[]
}

export interface WhatsAppAnalytics {
  id: string
  campaignId: string
  status: WhatsAppAnalyticsStatus
  totalDelivered: number
  totalResponses: number
  responseRate: number
  avgResponseTime: string
  sentimentSummary: SentimentSummary
  categoryDistribution: Record<string, number>
  topKeywords: TopKeyword[]
  businessInsights: BusinessInsights
  analysisStartedAt: string
  analysisCompletedAt?: string
  errorMessage?: string
}

export interface StartWhatsAppAnalyticsRequest {
  aiModelId: string
}

export interface StartWhatsAppAnalyticsResponse {
  id: string
  campaignId: string
  status: WhatsAppAnalyticsStatus
}

export interface TimelineDataPoint {
  hour: string
  count: number
}

export interface WhatsAppTimelineResponse {
  data: TimelineDataPoint[]
  period: 'hourly' | 'daily'
}

export interface WhatsAppTimelineParams {
  period?: 'hourly' | 'daily'
}
