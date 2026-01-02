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
}
