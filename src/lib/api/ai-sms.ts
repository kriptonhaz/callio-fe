import { apiClient } from './client'
import type {
  GenerateSmsRequest,
  GenerateSmsResponse,
} from './types/ai-models.types'

// AI completions are long-tail; even short SMS can occasionally run past the
// default 30s client timeout when the model is cold or the queue is busy.
// Bump per-call so this never trips on transient slowness.
const AI_TIMEOUT_MS = 60_000

export const aiSmsApi = {
  /**
   * Generate SMS text using AI
   */
  generate: async (data: GenerateSmsRequest): Promise<GenerateSmsResponse> => {
    return apiClient
      .post('ai/sms/generate', { json: data, timeout: AI_TIMEOUT_MS })
      .json()
  },
}
