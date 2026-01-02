import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { aiSmsApi } from '@/lib/api/ai-sms'
import type {
  GenerateSmsRequest,
  GenerateSmsResponse,
} from '@/lib/api/types/ai-models.types'

/**
 * Hook for generating SMS text using AI
 */
export const useGenerateSms = (): UseMutationResult<
  GenerateSmsResponse,
  Error,
  GenerateSmsRequest
> => {
  return useMutation({
    mutationFn: aiSmsApi.generate,
  })
}
