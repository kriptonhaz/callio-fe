export interface LeadAssignmentAnalyticsParams {
  clientId?: string
  agentId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
}

export interface TodayQueue {
  pending: number
  processed: number
  total: number
}

export interface DailyBreakdownItem {
  date: string
  total: number
  processed: number
  pending: number
}

export interface StatusBreakdownItem {
  status: string
  count: number
  percentage: number
}

export interface CallDispositionBreakdownItem {
  disposition: string
  count: number
}

export interface CampaignBreakdownItem {
  campaignId: string
  campaignName: string
  count: number
}

export interface FollowupStats {
  averageFollowups: number
  maxFollowups: number
  totalFollowups: number
}

export interface ProcessingRate {
  total: number
  processed: number
  rate: number
}

export interface LeadAssignmentAnalyticsResponse {
  todayQueue: TodayQueue
  dailyBreakdown: DailyBreakdownItem[]
  statusBreakdown: StatusBreakdownItem[]
  callDispositionBreakdown: CallDispositionBreakdownItem[]
  campaignBreakdown: CampaignBreakdownItem[]
  followupStats: FollowupStats
  processingRate: ProcessingRate
}
