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

// AI Email Template Generation
export interface GenerateEmailTemplateRequest {
  prompt: string
  modelId: string
  // Optional context — if the user already typed a name/subject, pass it
  // along so the model can match tone/topic.
  subject?: string
  templateName?: string
}

export interface GenerateEmailTemplateResponse {
  // Full HTML document — should include <!DOCTYPE>, <head>, <style>, <body>
  // so the user lands in View Source with styling preserved.
  html: string
  // Optional subject suggestion. FE only applies it when the user has not
  // typed their own subject yet.
  subject?: string
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
