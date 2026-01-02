import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { operatorPrefixesApi } from '@/lib/api/operator-prefixes'
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  OperatorPrefix,
  CreateOperatorPrefixRequest,
  UpdateOperatorPrefixRequest,
  OperatorPrefixesQueryParams,
} from '@/lib/api/types/operator-prefixes.types'

export const operatorPrefixesKeys = {
  all: ['operator-prefixes'] as const,
  lists: () => [...operatorPrefixesKeys.all, 'list'] as const,
  list: (params: OperatorPrefixesQueryParams) =>
    [...operatorPrefixesKeys.lists(), params] as const,
  details: () => [...operatorPrefixesKeys.all, 'detail'] as const,
  detail: (id: string) => [...operatorPrefixesKeys.details(), id] as const,
}

export const useOperatorPrefixes = (
  params: OperatorPrefixesQueryParams = {},
): UseQueryResult<PaginatedResponse<OperatorPrefix>, Error> => {
  return useQuery({
    queryKey: operatorPrefixesKeys.list(params),
    queryFn: () => operatorPrefixesApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

export const useOperatorPrefix = (
  id: string,
): UseQueryResult<OperatorPrefix, Error> => {
  return useQuery({
    queryKey: operatorPrefixesKeys.detail(id),
    queryFn: () => operatorPrefixesApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export const useCreateOperatorPrefix = (): UseMutationResult<
  OperatorPrefix,
  Error,
  CreateOperatorPrefixRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: operatorPrefixesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatorPrefixesKeys.lists() })
    },
  })
}

export const useUpdateOperatorPrefix = (): UseMutationResult<
  OperatorPrefix,
  Error,
  { id: string; data: UpdateOperatorPrefixRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => operatorPrefixesApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: operatorPrefixesKeys.lists() })
      queryClient.setQueryData(operatorPrefixesKeys.detail(variables.id), data)
    },
  })
}

export const useDeleteOperatorPrefix = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: operatorPrefixesApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: operatorPrefixesKeys.lists() })
      queryClient.removeQueries({ queryKey: operatorPrefixesKeys.detail(id) })
    },
  })
}
