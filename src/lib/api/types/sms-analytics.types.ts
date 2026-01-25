// SMS Analytics Types

export interface SmsSummary {
  totalMessages: number
  totalSent: number
  totalDelivered: number
  totalFailed: number
  totalPending: number
  successRate: number
  deliveryRate: number
  totalSegments: number
  totalCost: number
}

export interface SmsByMasking {
  maskingId: string
  maskingName: string
  count: number
  percentage: number
}

export interface SmsByStatus {
  status: string
  count: number
  percentage: number
}

export interface SmsHourlyVolume {
  hour: number
  total: number
  sent: number
  failed: number
}

export interface SmsAnalytics {
  campaignId: string
  campaignName: string
  summary: SmsSummary
  byMasking: SmsByMasking[]
  byStatus: SmsByStatus[]
  hourlyVolume: SmsHourlyVolume[]
}
