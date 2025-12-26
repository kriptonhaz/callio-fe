import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  SipExtension,
  SipExtensionsQueryParams,
  CreateSipExtensionRequest,
  BulkCreateSipExtensionRequest,
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

  bulkCreate: async (
    data: BulkCreateSipExtensionRequest,
  ): Promise<{ created: number }> => {
    return await apiClient
      .post('sip/extensions/bulk-create', { json: data })
      .json<{ created: number }>()
  },

  assign: async (
    extensionId: string,
    userId: string,
  ): Promise<SipExtension> => {
    return await apiClient
      .post(`sip/extensions/${extensionId}/assign`, { json: { userId } })
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

export const useBulkCreateSipExtension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sipExtensionsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sipExtensionsKeys.lists() })
    },
  })
}

export const useAssignSipExtension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      extensionId,
      userId,
    }: {
      extensionId: string
      userId: string
    }) => sipExtensionsApi.assign(extensionId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sipExtensionsKeys.lists() })
      // Also invalidate users list to refresh the table
      queryClient.invalidateQueries({ queryKey: ['users'] })
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
