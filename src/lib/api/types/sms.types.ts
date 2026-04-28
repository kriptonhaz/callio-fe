import { PaginationParams } from '../types'

export type SmsTiming = 'now' | 'scheduled'

export enum SmsStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface SmsHistory {
  id: string
  clientId: string
  campaignId: string
  leadAssignmentId: string | null
  maskingId: string | null
  phoneNumber: string
  message: string
  status: SmsStatus
  scheduledAt: string | null
  sentAt: string | null
  deliveredAt: string | null
  failedAt: string | null
  errorMessage: string | null
  providerRef: string | null
  segmentCount: number
  cost: number | null
  source: string
  sourceIp: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  masking: {
    name: string
  } | null
  lead: {
    id: string
    leadId: string
    lead: {
      leadName: string
    }
  } | null
  creator: {
    name: string
  } | null
  operatorName: string | null
}

export interface SmsHistoryQueryParams extends PaginationParams {
  campaignId?: string
  status?: SmsStatus
  startDate?: string
  endDate?: string
  search?: string
}

export interface ComposeSmsRequest {
  message: string
  maskingId: string
  timing: SmsTiming
  scheduledAt?: string
  leadAssignmentIds: string[]
}

// Ad-hoc SMS to a phone that isn't a tracked lead-assignment (e.g. an
// emergency contact). The BE must store the resulting history row with a
// null leadAssignmentId so reporting still works without a fake assignment.
export interface SendSmsToPhoneRequest {
  phone: string
  message: string
  maskingId: string
  timing?: SmsTiming
  scheduledAt?: string
  // Optional context — when set, attributes the send to a related lead in
  // reporting without changing the destination phone.
  relatedLeadId?: string
  relatedLeadAssignmentId?: string
}

export interface ComposeSmsResponse {
  success: boolean
  message: string
  scheduledCount?: number
  sentCount?: number
}

// SMS Analytics Types
export interface SmsAnalyticsQueryParams {
  clientId?: string
  startDate?: string
  endDate?: string
}

export interface SmsAnalyticsSummary {
  totalMessages: number
  totalSent: number
  totalFailed: number
  totalPending: number
  successRate: number
  totalSegments: number
  totalCost: number
}

export interface SmsAnalyticsByMasking {
  maskingId: string
  maskingName: string
  count: number
  percentage: number
}

export interface SmsAnalyticsByStatus {
  status: string
  count: number
  percentage: number
}

export interface SmsAnalyticsByOperator {
  operatorName: string
  count: number
  percentage: number
}

export interface SmsAnalyticsDailyTrend {
  date: string
  total: number
  sent: number
  failed: number
}

export interface SmsAnalyticsResponse {
  summary: SmsAnalyticsSummary
  byMasking: SmsAnalyticsByMasking[]
  byStatus: SmsAnalyticsByStatus[]
  byOperator: SmsAnalyticsByOperator[]
  dailyTrend: SmsAnalyticsDailyTrend[]
}
