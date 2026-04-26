import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { aiEmailTemplateApi } from '@/lib/api/ai-email-template'
import type {
  GenerateEmailTemplateRequest,
  GenerateEmailTemplateResponse,
} from '@/lib/api/types/ai-models.types'

/**
 * Hook for generating an HTML email template using AI.
 */
export const useGenerateEmailTemplate = (): UseMutationResult<
  GenerateEmailTemplateResponse,
  Error,
  GenerateEmailTemplateRequest
> => {
  return useMutation({
    mutationFn: aiEmailTemplateApi.generate,
  })
}
