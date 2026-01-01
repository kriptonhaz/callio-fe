import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  IpWhitelistResponse,
  UpdateIpWhitelistRequest,
  SmsMaskingListResponse,
  SmsMasking,
  CreateSmsMaskingRequest,
  UpdateSmsMaskingRequest,
} from '@/lib/api/types/ip-whitelist.types'

export const ipWhitelistKeys = {
  all: ['ip-whitelist'] as const,
  client: (clientId: string) =>
    [...ipWhitelistKeys.all, 'client', clientId] as const,
}

export const smsMaskingKeys = {
  all: ['sms-masking'] as const,
  client: (clientId: string) =>
    [...smsMaskingKeys.all, 'client', clientId] as const,
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

const smsMaskingApi = {
  getClientSmsMasking: async (
    clientId: string,
  ): Promise<SmsMaskingListResponse> => {
    return await apiClient
      .get(`sms-masking`, { searchParams: { clientId } })
      .json<SmsMaskingListResponse>()
  },

  createSmsMasking: async (
    data: CreateSmsMaskingRequest,
  ): Promise<SmsMasking> => {
    return await apiClient
      .post(`sms-masking`, { json: data })
      .json<SmsMasking>()
  },

  updateSmsMasking: async (
    id: string,
    data: UpdateSmsMaskingRequest,
  ): Promise<SmsMasking> => {
    return await apiClient
      .patch(`sms-masking/${id}`, { json: data })
      .json<SmsMasking>()
  },

  deleteSmsMasking: async (id: string): Promise<void> => {
    await apiClient.delete(`sms-masking/${id}`)
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

export const useClientSmsMasking = (clientId: string, enabled = true) =>
  useQuery({
    queryKey: smsMaskingKeys.client(clientId),
    queryFn: () => smsMaskingApi.getClientSmsMasking(clientId),
    enabled,
    staleTime: 30 * 1000,
  })

export const useCreateSmsMasking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSmsMaskingRequest) =>
      smsMaskingApi.createSmsMasking(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: smsMaskingKeys.client(variables.clientId),
      })
    },
  })
}

export const useUpdateSmsMasking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      clientId: string
      data: UpdateSmsMaskingRequest
    }) => smsMaskingApi.updateSmsMasking(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: smsMaskingKeys.client(variables.clientId),
      })
    },
  })
}

export const useDeleteSmsMasking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; clientId: string }) =>
      smsMaskingApi.deleteSmsMasking(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: smsMaskingKeys.client(variables.clientId),
      })
    },
  })
}
