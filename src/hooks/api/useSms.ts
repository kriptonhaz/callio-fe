import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  ComposeSmsRequest,
  ComposeSmsResponse,
  SmsHistory,
  SmsHistoryQueryParams,
  SmsAnalyticsQueryParams,
  SmsAnalyticsResponse,
} from '@/lib/api/types/sms.types'
import { PaginatedResponse } from '@/lib/api/types'
import { buildQueryString } from '@/lib/api/client'

export interface BulkCancelSmsRequest {
  ids: string[]
}

export interface BulkCancelSmsResponse {
  cancelled: number
  failed: number
  errors: Array<{ id: string; reason: string }>
}

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
  bulkCancel: async (
    data: BulkCancelSmsRequest,
  ): Promise<BulkCancelSmsResponse> => {
    return await apiClient
      .post('sms/bulk-cancel', { json: data })
      .json<BulkCancelSmsResponse>()
  },
  getAnalytics: async (
    params: SmsAnalyticsQueryParams,
  ): Promise<SmsAnalyticsResponse> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`sms/analytics${queryString}`)
      .json<SmsAnalyticsResponse>()
  },
}

export const smsKeys = {
  all: ['sms'] as const,
  history: (params: SmsHistoryQueryParams) =>
    [...smsKeys.all, 'history', params] as const,
  analytics: (params: SmsAnalyticsQueryParams) =>
    [...smsKeys.all, 'analytics', params] as const,
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

export const useBulkCancelSms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkCancelSmsRequest) => smsApi.bulkCancel(data),
    onSuccess: () => {
      // Invalidate SMS history queries to refetch data
      void queryClient.invalidateQueries({ queryKey: smsKeys.all })
    },
  })
}

export const useSmsAnalytics = (
  params: SmsAnalyticsQueryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: smsKeys.analytics(params),
    queryFn: () => smsApi.getAnalytics(params),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export interface SmsExportParams {
  campaignId?: string
  clientId?: string
  leadAssignmentId?: string
  status?: string
  phoneNumber?: string
  search?: string
  startDate?: string
  endDate?: string
}

export const useExportSmsHistory = () => {
  return useMutation({
    mutationFn: async (params: SmsExportParams): Promise<Blob> => {
      const queryString = buildQueryString(params)
      const response = await apiClient.get(`sms/history/export${queryString}`)
      return response.blob()
    },
  })
}
