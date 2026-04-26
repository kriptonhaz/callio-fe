import { apiClient } from './client'
import type {
  GenerateEmailTemplateRequest,
  GenerateEmailTemplateResponse,
} from './types/ai-models.types'

// AI completions are inherently long-tail — full HTML email templates can run
// 20–40s end-to-end. The default 30s client timeout is too tight, so we
// override per-call to 60s.
const AI_TIMEOUT_MS = 60_000

export const aiEmailTemplateApi = {
  /**
   * Generate an HTML email template using AI.
   * Backend should return a complete HTML document so the editor lands in
   * View Source mode with styles preserved.
   */
  generate: async (
    data: GenerateEmailTemplateRequest,
  ): Promise<GenerateEmailTemplateResponse> => {
    return apiClient
      .post('ai/email-template/generate', {
        json: data,
        timeout: AI_TIMEOUT_MS,
      })
      .json()
  },
}
