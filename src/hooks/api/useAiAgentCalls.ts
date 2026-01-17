import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

// Hardcoded VAPI Assistant ID for now
const VAPI_ASSISTANT_ID = 'a15680a0-69b1-4077-9f17-ea3b23e71cd2'

export interface InitiateAiAgentCallRequest {
  destinationNumber: string
  aiAgentConfigId?: string | null
  vapiAssistantId: string
  leadId: string
  campaignId: string
}

export interface InitiateAiAgentCallResponse {
  callId: string
  status: string
}

const aiAgentCallsApi = {
  initiate: async (
    data: InitiateAiAgentCallRequest,
  ): Promise<InitiateAiAgentCallResponse> => {
    return await apiClient
      .post('ai-agent-calls/initiate', { json: data })
      .json<InitiateAiAgentCallResponse>()
  },
}

export const useInitiateAiAgentCall = () =>
  useMutation({
    mutationFn: (data: Omit<InitiateAiAgentCallRequest, 'vapiAssistantId'>) =>
      aiAgentCallsApi.initiate({
        ...data,
        vapiAssistantId: VAPI_ASSISTANT_ID,
      }),
  })
