import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  AssignSipRangeRequest,
  AssignSipRangeResponse,
  ClientExtensionRangeResponse,
} from '@/lib/api/types/sip-range.types'

export const sipRangeKeys = {
  all: ['sip-range'] as const,
  clientRange: (clientId: string) =>
    [...sipRangeKeys.all, 'client', clientId] as const,
}

const sipRangeApi = {
  getClientExtensionRange: async (
    clientId: string,
  ): Promise<ClientExtensionRangeResponse> => {
    return await apiClient
      .get(`sip/clients/${clientId}/extension-range`)
      .json<ClientExtensionRangeResponse>()
  },

  assignRange: async (
    data: AssignSipRangeRequest,
  ): Promise<AssignSipRangeResponse> => {
    return await apiClient
      .post('sip/assign-range', { json: data })
      .json<AssignSipRangeResponse>()
  },
}

export const useClientExtensionRange = (clientId: string, enabled = true) =>
  useQuery({
    queryKey: sipRangeKeys.clientRange(clientId),
    queryFn: () => sipRangeApi.getClientExtensionRange(clientId),
    enabled,
    staleTime: 30 * 1000,
  })

export const useAssignSipRange = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sipRangeApi.assignRange,
    onSuccess: (data) => {
      // Invalidate client queries and the specific range query
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({
        queryKey: sipRangeKeys.clientRange(data.clientId),
      })
    },
  })
}
