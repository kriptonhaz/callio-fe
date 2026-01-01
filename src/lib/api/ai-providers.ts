import { apiClient, buildQueryString } from './client'
import type {
  AiProvider,
  CreateAiProviderRequest,
  UpdateAiProviderRequest,
  AiProviderQueryParams,
} from './types/ai-providers.types'
import type { PaginatedResponse } from './types'

export const aiProvidersApi = {
  // Get all AI providers (paginated)
  getAll: async (
    params: AiProviderQueryParams = {},
  ): Promise<PaginatedResponse<AiProvider>> => {
    const queryString = buildQueryString(params)
    return apiClient
      .get(`ai-providers${queryString}`)
      .json<PaginatedResponse<AiProvider>>()
  },

  // Get single AI provider
  getById: async (id: string): Promise<AiProvider> => {
    return apiClient.get(`ai-providers/${id}`).json<AiProvider>()
  },

  // Create AI provider
  create: async (data: CreateAiProviderRequest): Promise<AiProvider> => {
    return apiClient.post('ai-providers', { json: data }).json<AiProvider>()
  },

  // Update AI provider
  update: async (
    id: string,
    data: UpdateAiProviderRequest,
  ): Promise<AiProvider> => {
    return apiClient
      .patch(`ai-providers/${id}`, { json: data })
      .json<AiProvider>()
  },

  // Delete AI provider
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`ai-providers/${id}`)
  },
}
