import { PaginationParams } from '../types'

export type SmsTiming = 'now' | 'scheduled'

export enum SmsStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
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

export interface ComposeSmsResponse {
  success: boolean
  message: string
  scheduledCount?: number
  sentCount?: number
}
