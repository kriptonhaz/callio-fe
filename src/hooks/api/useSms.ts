import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  ComposeSmsRequest,
  ComposeSmsResponse,
} from '@/lib/api/types/sms.types'

const smsApi = {
  compose: async (
    campaignId: string,
    data: ComposeSmsRequest,
  ): Promise<ComposeSmsResponse> => {
    return await apiClient
      .post(`sms/campaigns/${campaignId}/compose`, { json: data })
      .json<ComposeSmsResponse>()
  },
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
