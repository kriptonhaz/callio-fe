import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  SipExtension,
  SipExtensionsQueryParams,
  CreateSipExtensionRequest,
} from '@/lib/api/types/sip-extension.types'

export const sipExtensionsKeys = {
  all: ['sip-extensions'] as const,
  lists: () => [...sipExtensionsKeys.all, 'list'] as const,
  list: (params: SipExtensionsQueryParams) =>
    [...sipExtensionsKeys.lists(), params] as const,
}

const sipExtensionsApi = {
  getAll: async (
    params: SipExtensionsQueryParams,
  ): Promise<PaginatedResponse<SipExtension>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`sip/extensions${queryString}`)
      .json<PaginatedResponse<SipExtension>>()
  },

  create: async (data: CreateSipExtensionRequest): Promise<SipExtension> => {
    return await apiClient
      .post('sip/extensions', { json: data })
      .json<SipExtension>()
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`sip/extensions/${id}`)
  },
}

export const useSipExtensions = (params: SipExtensionsQueryParams = {}) =>
  useQuery({
    queryKey: sipExtensionsKeys.list(params),
    queryFn: () => sipExtensionsApi.getAll(params),
    staleTime: 30 * 1000,
  })

export const useCreateSipExtension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sipExtensionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sipExtensionsKeys.lists() })
    },
  })
}

export const useDeleteSipExtension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sipExtensionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sipExtensionsKeys.lists() })
    },
  })
}
