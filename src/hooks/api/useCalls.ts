import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

interface DialCallRequest {
  destinationNumber: string
}

interface DialCallResponse {
  callId?: string
  status?: string
  message?: string
}

const callsApi = {
  dial: async (data: DialCallRequest): Promise<DialCallResponse> => {
    return apiClient.post('calls/dial', { json: data }).json<DialCallResponse>()
  },
}

export const useDialCall = () => {
  return useMutation({
    mutationFn: callsApi.dial,
  })
}
