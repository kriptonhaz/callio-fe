import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { aiUsageApi } from '@/lib/api/ai-usage'
import type {
  AiUsageQueryParams,
  AiUsageResponse,
} from '@/lib/api/types/ai-usage.types'

// Query keys
export const aiUsageKeys = {
  all: ['aiUsage'] as const,
  lists: () => [...aiUsageKeys.all, 'list'] as const,
  list: (params: AiUsageQueryParams) =>
    [...aiUsageKeys.lists(), params] as const,
}

/**
 * Hook for fetching AI usage logs
 */
export const useAiUsage = (
  params: AiUsageQueryParams = {},
  enabled = true,
): UseQueryResult<AiUsageResponse, Error> => {
  return useQuery({
    queryKey: aiUsageKeys.list(params),
    queryFn: () => aiUsageApi.getAll(params),
    enabled,
  })
}
