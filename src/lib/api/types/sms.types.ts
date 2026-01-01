export type SmsTiming = 'now' | 'scheduled'

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
