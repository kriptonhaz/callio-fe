import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  IpWhitelistResponse,
  UpdateIpWhitelistRequest,
} from '@/lib/api/types/ip-whitelist.types'

export const ipWhitelistKeys = {
  all: ['ip-whitelist'] as const,
  client: (clientId: string) =>
    [...ipWhitelistKeys.all, 'client', clientId] as const,
}

const ipWhitelistApi = {
  getClientIpWhitelist: async (
    clientId: string,
  ): Promise<IpWhitelistResponse> => {
    return await apiClient
      .get(`sms-masking/clients/${clientId}/ip-whitelist`)
      .json<IpWhitelistResponse>()
  },

  updateIpWhitelist: async (
    clientId: string,
    data: UpdateIpWhitelistRequest,
  ): Promise<IpWhitelistResponse> => {
    return await apiClient
      .patch(`sms-masking/clients/${clientId}/ip-whitelist`, { json: data })
      .json<IpWhitelistResponse>()
  },
}

export const useClientIpWhitelist = (clientId: string, enabled = true) =>
  useQuery({
    queryKey: ipWhitelistKeys.client(clientId),
    queryFn: () => ipWhitelistApi.getClientIpWhitelist(clientId),
    enabled,
    staleTime: 30 * 1000,
  })

export const useUpdateIpWhitelist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string
      data: UpdateIpWhitelistRequest
    }) => ipWhitelistApi.updateIpWhitelist(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ipWhitelistKeys.client(variables.clientId),
      })
    },
  })
}
