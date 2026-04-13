import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  CustomFieldKeysResponse,
  ResolvedLayoutResponse,
  UpsertLayoutRequest,
} from '@/lib/api/types/layout-configs.types'

export const layoutConfigsKeys = {
  all: ['layout-configs'] as const,
  default: () => [...layoutConfigsKeys.all, 'default'] as const,
  campaign: (campaignId: string) =>
    [...layoutConfigsKeys.all, 'campaign', campaignId] as const,
  customKeys: (campaignId: string) =>
    [...layoutConfigsKeys.all, 'campaign', campaignId, 'custom-keys'] as const,
}

const layoutConfigsApi = {
  getDefault: async (): Promise<ResolvedLayoutResponse> =>
    await apiClient.get('layout-configs/default').json<ResolvedLayoutResponse>(),

  getForCampaign: async (campaignId: string): Promise<ResolvedLayoutResponse> =>
    await apiClient
      .get(`layout-configs/campaigns/${campaignId}`)
      .json<ResolvedLayoutResponse>(),

  getCustomFieldKeys: async (
    campaignId: string,
  ): Promise<CustomFieldKeysResponse> =>
    await apiClient
      .get(`layout-configs/campaigns/${campaignId}/custom-field-keys`)
      .json<CustomFieldKeysResponse>(),

  upsertDefault: async (data: UpsertLayoutRequest): Promise<unknown> =>
    await apiClient.put('layout-configs/default', { json: data }).json(),

  upsertForCampaign: async (
    campaignId: string,
    data: UpsertLayoutRequest,
  ): Promise<unknown> =>
    await apiClient
      .put(`layout-configs/campaigns/${campaignId}`, { json: data })
      .json(),

  resetCampaign: async (campaignId: string): Promise<void> => {
    await apiClient.delete(`layout-configs/campaigns/${campaignId}`)
  },
}

export const useDefaultLayout = (): UseQueryResult<
  ResolvedLayoutResponse,
  Error
> =>
  useQuery({
    queryKey: layoutConfigsKeys.default(),
    queryFn: layoutConfigsApi.getDefault,
    staleTime: 60 * 1000,
  })

export const useCampaignLayout = (
  campaignId: string,
): UseQueryResult<ResolvedLayoutResponse, Error> =>
  useQuery({
    queryKey: layoutConfigsKeys.campaign(campaignId),
    queryFn: () => layoutConfigsApi.getForCampaign(campaignId),
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  })

export const useCampaignCustomFieldKeys = (
  campaignId: string,
): UseQueryResult<CustomFieldKeysResponse, Error> =>
  useQuery({
    queryKey: layoutConfigsKeys.customKeys(campaignId),
    queryFn: () => layoutConfigsApi.getCustomFieldKeys(campaignId),
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  })

export const useUpsertDefaultLayout = (): UseMutationResult<
  unknown,
  Error,
  UpsertLayoutRequest
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: layoutConfigsApi.upsertDefault,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: layoutConfigsKeys.all })
    },
  })
}

export const useUpsertCampaignLayout = (
  campaignId: string,
): UseMutationResult<unknown, Error, UpsertLayoutRequest> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => layoutConfigsApi.upsertForCampaign(campaignId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: layoutConfigsKeys.campaign(campaignId) })
    },
  })
}

export const useResetCampaignLayout = (
  campaignId: string,
): UseMutationResult<void, Error, void> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => layoutConfigsApi.resetCampaign(campaignId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: layoutConfigsKeys.campaign(campaignId) })
    },
  })
}
