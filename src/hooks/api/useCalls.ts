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

interface InitiateSessionRequest {
  campaignId: string
  leadId: string
  phoneNumber: string
  agentId: string
}

interface InitiateSessionResponse {
  sessionToken: string
  callLogId: string
}

const callsApi = {
  dial: async (data: DialCallRequest): Promise<DialCallResponse> => {
    return apiClient.post('calls/dial', { json: data }).json<DialCallResponse>()
  },
  initiateSession: async (
    data: InitiateSessionRequest,
  ): Promise<InitiateSessionResponse> => {
    return apiClient
      .post('call-logs/initiate-session', { json: data })
      .json<InitiateSessionResponse>()
  },
}

export const useDialCall = () => {
  return useMutation({
    mutationFn: callsApi.dial,
  })
}

export const useInitiateCallSession = () => {
  return useMutation({
    mutationFn: callsApi.initiateSession,
  })
}
