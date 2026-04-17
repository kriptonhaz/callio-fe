export interface LeadAssignmentAnalyticsParams {
  clientId?: string
  agentId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
  byAgent?: boolean
  outcomeFunnel?: boolean
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

export interface PerAgentBreakdownItem {
  agentId: string
  agentName: string
  statusCounts: Record<string, number>
  totalLeads: number
  conversionCount: number
}

export interface OutcomeFunnelItem {
  statusSlug: string
  leadCount: number
  avgAttemptsToReach: number
}

export interface LeadAssignmentAnalyticsResponse {
  todayQueue: TodayQueue
  dailyBreakdown: Array<DailyBreakdownItem>
  statusBreakdown: Array<StatusBreakdownItem>
  callDispositionBreakdown: Array<CallDispositionBreakdownItem>
  campaignBreakdown: Array<CampaignBreakdownItem>
  followupStats: FollowupStats
  processingRate: ProcessingRate
  perAgentBreakdown?: Array<PerAgentBreakdownItem>
  outcomeFunnel?: Array<OutcomeFunnelItem>
}
