import { PaginationParams } from '../types'

export interface AiModel {
  id: string
  providerId: string
  name: string
  modelId: string
  description: string | null
  capabilities: string[]
  inputPricePerToken: number | string
  outputPricePerToken: number | string
  maxContextTokens: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAiModelRequest {
  providerId: string
  name: string
  modelId: string
  description?: string
  capabilities: string[]
  inputPricePerToken: number
  outputPricePerToken: number
  maxContextTokens: number
  isActive: boolean
}

export interface UpdateAiModelRequest {
  name?: string
  modelId?: string
  description?: string
  capabilities?: string[]
  inputPricePerToken?: number
  outputPricePerToken?: number
  maxContextTokens?: number
  isActive?: boolean
}

export interface AiModelQueryParams extends PaginationParams {
  providerId?: string
  capability?: string
}

// AI SMS Generation
export interface GenerateSmsRequest {
  prompt: string
  modelId: string
  smsType?: string
  maxLength?: number
}

export interface GenerateSmsResponse {
  content: string
  characterCount: number
  smsType: string
  modelUsed: {
    id: string
    name: string
    provider: string
  }
  tokensUsed: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  costAmount: number
}
