export interface PerformanceListParams {
  clientId?: string
  agentId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface PerformanceLeadRow {
  leadId: string
  leadName: string
  phone: string
  agentId: string | null
  agentName: string | null
  campaignId: string
  campaignName: string
  attempts: number
  currentStatus: string
  lastCallStatus: string | null
  firstContactedAt: string | null
  lastContactedAt: string | null
  leadProgressNotes: string | null
}
