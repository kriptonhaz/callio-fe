import { apiClient, buildQueryString } from './client'
import type {
  AiModel,
  CreateAiModelRequest,
  UpdateAiModelRequest,
  AiModelQueryParams,
} from './types/ai-models.types'
import type { PaginatedResponse } from './types'

export const aiModelsApi = {
  // Get all AI models (paginated, filtered by providerId)
  getAll: async (
    params: AiModelQueryParams = {},
  ): Promise<PaginatedResponse<AiModel>> => {
    const queryString = buildQueryString(params)
    return apiClient
      .get(`ai-models${queryString}`)
      .json<PaginatedResponse<AiModel>>()
  },

  // Get single AI model
  getById: async (id: string): Promise<AiModel> => {
    return apiClient.get(`ai-models/${id}`).json<AiModel>()
  },

  // Create AI model
  create: async (data: CreateAiModelRequest): Promise<AiModel> => {
    return apiClient.post('ai-models', { json: data }).json<AiModel>()
  },

  // Update AI model
  update: async (id: string, data: UpdateAiModelRequest): Promise<AiModel> => {
    return apiClient.patch(`ai-models/${id}`, { json: data }).json<AiModel>()
  },

  // Delete AI model
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`ai-models/${id}`)
  },
}
