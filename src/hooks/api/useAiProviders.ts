import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { aiProvidersApi } from '@/lib/api/ai-providers'
import type {
  AiProvider,
  CreateAiProviderRequest,
  UpdateAiProviderRequest,
  AiProviderQueryParams,
} from '@/lib/api/types/ai-providers.types'
import type { PaginatedResponse } from '@/lib/api/types'

// Query keys
export const aiProviderKeys = {
  all: ['aiProviders'] as const,
  lists: () => [...aiProviderKeys.all, 'list'] as const,
  list: (params: AiProviderQueryParams) =>
    [...aiProviderKeys.lists(), params] as const,
  details: () => [...aiProviderKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiProviderKeys.details(), id] as const,
}

// Get paginated AI providers
export const useAiProviders = (
  params: AiProviderQueryParams = {},
): UseQueryResult<PaginatedResponse<AiProvider>, Error> => {
  return useQuery({
    queryKey: aiProviderKeys.list(params),
    queryFn: () => aiProvidersApi.getAll(params),
  })
}

// Get single AI provider
export const useAiProvider = (
  id: string,
): UseQueryResult<AiProvider, Error> => {
  return useQuery({
    queryKey: aiProviderKeys.detail(id),
    queryFn: () => aiProvidersApi.getById(id),
    enabled: !!id,
  })
}

// Create AI provider
export const useCreateAiProvider = (): UseMutationResult<
  AiProvider,
  Error,
  CreateAiProviderRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiProvidersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.lists() })
    },
  })
}

// Update AI provider
export const useUpdateAiProvider = (): UseMutationResult<
  AiProvider,
  Error,
  { id: string; data: UpdateAiProviderRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => aiProvidersApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.lists() })
      queryClient.setQueryData(aiProviderKeys.detail(variables.id), data)
    },
  })
}

// Delete AI provider
export const useDeleteAiProvider = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiProvidersApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.lists() })
      queryClient.removeQueries({ queryKey: aiProviderKeys.detail(id) })
    },
  })
}
