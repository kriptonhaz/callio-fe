import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { aiModelsApi } from '@/lib/api/ai-models'
import type {
  AiModel,
  CreateAiModelRequest,
  UpdateAiModelRequest,
  AiModelQueryParams,
} from '@/lib/api/types/ai-models.types'
import type { PaginatedResponse } from '@/lib/api/types'

// Query keys
export const aiModelKeys = {
  all: ['aiModels'] as const,
  lists: () => [...aiModelKeys.all, 'list'] as const,
  list: (params: AiModelQueryParams) =>
    [...aiModelKeys.lists(), params] as const,
  details: () => [...aiModelKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiModelKeys.details(), id] as const,
}

// Get paginated AI models (filtered by providerId)
export const useAiModels = (
  params: AiModelQueryParams = {},
  enabled = true,
): UseQueryResult<PaginatedResponse<AiModel>, Error> => {
  return useQuery({
    queryKey: aiModelKeys.list(params),
    queryFn: () => aiModelsApi.getAll(params),
    enabled,
  })
}

// Get single AI model
export const useAiModel = (id: string): UseQueryResult<AiModel, Error> => {
  return useQuery({
    queryKey: aiModelKeys.detail(id),
    queryFn: () => aiModelsApi.getById(id),
    enabled: !!id,
  })
}

// Create AI model
export const useCreateAiModel = (): UseMutationResult<
  AiModel,
  Error,
  CreateAiModelRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiModelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiModelKeys.lists() })
    },
  })
}

// Update AI model
export const useUpdateAiModel = (): UseMutationResult<
  AiModel,
  Error,
  { id: string; data: UpdateAiModelRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => aiModelsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiModelKeys.lists() })
      queryClient.setQueryData(aiModelKeys.detail(variables.id), data)
    },
  })
}

// Delete AI model
export const useDeleteAiModel = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiModelsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: aiModelKeys.lists() })
      queryClient.removeQueries({ queryKey: aiModelKeys.detail(id) })
    },
  })
}
