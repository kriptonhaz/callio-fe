import { apiClient } from './client'
import type {
  AiUsageQueryParams,
  AiUsageResponse,
} from './types/ai-usage.types'

export const aiUsageApi = {
  /**
   * Get paginated AI usage logs
   */
  getAll: async (params: AiUsageQueryParams): Promise<AiUsageResponse> => {
    return apiClient.get('ai/usage', { searchParams: params as any }).json()
  },
}
