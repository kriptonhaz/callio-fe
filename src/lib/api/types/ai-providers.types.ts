import { PaginationParams } from '../types'

export interface AiProvider {
  id: string
  name: string
  slug: string
  apiBaseUrl: string
  apiKeyEncrypted: string
  isActive: boolean
  healthStatus: 'online' | 'offline' | 'unknown'
  lastHealthCheck: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    models: number
  }
}

export interface CreateAiProviderRequest {
  name: string
  slug: string
  apiBaseUrl: string
  apiKey: string
  isActive: boolean
}

export interface UpdateAiProviderRequest {
  name?: string
  slug?: string
  apiBaseUrl?: string
  apiKey?: string
  isActive?: boolean
}

export interface AiProviderQueryParams extends PaginationParams {
  search?: string
}
