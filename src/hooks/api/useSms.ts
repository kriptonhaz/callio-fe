import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  ComposeSmsRequest,
  ComposeSmsResponse,
  SmsHistory,
  SmsHistoryQueryParams,
} from '@/lib/api/types/sms.types'
import { PaginatedResponse } from '@/lib/api/types'
import { buildQueryString } from '@/lib/api/client'

const smsApi = {
  compose: async (
    campaignId: string,
    data: ComposeSmsRequest,
  ): Promise<ComposeSmsResponse> => {
    return await apiClient
      .post(`sms/campaigns/${campaignId}/compose`, { json: data })
      .json<ComposeSmsResponse>()
  },
  getHistory: async (
    params: SmsHistoryQueryParams,
  ): Promise<PaginatedResponse<SmsHistory>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`sms/history${queryString}`)
      .json<PaginatedResponse<SmsHistory>>()
  },
}

export const smsKeys = {
  all: ['sms'] as const,
  history: (params: SmsHistoryQueryParams) =>
    [...smsKeys.all, 'history', params] as const,
}

export const useComposeSms = () => {
  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string
      data: ComposeSmsRequest
    }) => smsApi.compose(campaignId, data),
  })
}

export const useSmsHistory = (params: SmsHistoryQueryParams) => {
  return useQuery({
    queryKey: smsKeys.history(params),
    queryFn: () => smsApi.getHistory(params),
    placeholderData: (prev) => prev,
  })
}
