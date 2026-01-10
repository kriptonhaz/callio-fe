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

interface DialRecordingRequest {
  destinationNumber: string
  voiceRecordingId: string
  leadId: string
  campaignId: string
}

interface DialRecordingResponse {
  message: string
  callLogId: string
  port: number
  destination: string
  recordingPath: string
}

interface HangupRequest {
  callLogId: string
}

interface HangupResponse {
  message: string
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
  dialRecording: async (
    data: DialRecordingRequest,
  ): Promise<DialRecordingResponse> => {
    return apiClient
      .post('calls/dial-recording', { json: data })
      .json<DialRecordingResponse>()
  },
  hangup: async (data: HangupRequest): Promise<HangupResponse> => {
    return apiClient.post('calls/hangup', { json: data }).json<HangupResponse>()
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

export const useDialRecording = () => {
  return useMutation({
    mutationFn: callsApi.dialRecording,
  })
}

export const useHangupCall = () => {
  return useMutation({
    mutationFn: callsApi.hangup,
  })
}
