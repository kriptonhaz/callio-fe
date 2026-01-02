import { PaginationParams, PaginatedResponse } from '../types'

export interface AiUsageLog {
  id: string
  createdAt: string
  featureType: string
  serviceType: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costAmount: number
  latencyMs: number
  status: 'success' | 'failed'
  errorMessage?: string
  prompt?: string
  content?: string
  referenceType: string
  referenceId: string | null
  model: {
    id: string
    name: string
    provider: {
      name: string
    }
  }
}

export interface AiUsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
}

export interface AiUsageByModel {
  modelId: string
  modelName: string
  providerName: string
  totalTokens: number
  totalCost: number
  requestCount: number
}

export interface AiUsageByService {
  serviceType: string
  totalTokens: number
  totalCost: number
  requestCount: number
}

export interface AiUsageResponse {
  summary: AiUsageSummary
  byModel: AiUsageByModel[]
  byService: AiUsageByService[]
  records: AiUsageLog[]
  meta: PaginatedResponse<AiUsageLog>['meta']
}

export interface AiUsageQueryParams extends PaginationParams {
  startDate?: string
  endDate?: string
  serviceType?: string
  status?: string
}
