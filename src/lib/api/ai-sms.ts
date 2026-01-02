import { apiClient } from './client'
import type {
  GenerateSmsRequest,
  GenerateSmsResponse,
} from './types/ai-models.types'

export const aiSmsApi = {
  /**
   * Generate SMS text using AI
   */
  generate: async (data: GenerateSmsRequest): Promise<GenerateSmsResponse> => {
    return apiClient.post('ai/sms/generate', { json: data }).json()
  },
}
