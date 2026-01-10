import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/types'

export interface VoiceRecording {
  id: string
  name: string
  description?: string
  filename: string
  fileUrl: string
  duration?: number
  fileSize?: number
  mimeType?: string
  clientId: string
  createdAt: string
  updatedAt: string
}

export interface VoiceRecordingQueryParams {
  page?: number
  limit?: number
  search?: string
}

export interface UploadVoiceRecordingRequest {
  file: File
  name: string
  description?: string
}

const voiceRecordingsKeys = {
  all: ['voice-recordings'] as const,
  lists: () => [...voiceRecordingsKeys.all, 'list'] as const,
  list: (params: VoiceRecordingQueryParams) =>
    [...voiceRecordingsKeys.lists(), params] as const,
  details: () => [...voiceRecordingsKeys.all, 'detail'] as const,
  detail: (id: string) => [...voiceRecordingsKeys.details(), id] as const,
}

const voiceRecordingsApi = {
  getAll: async (
    params: VoiceRecordingQueryParams = {},
  ): Promise<PaginatedResponse<VoiceRecording>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`voice-recordings${queryString}`)
      .json<PaginatedResponse<VoiceRecording>>()
  },
  upload: async (
    data: UploadVoiceRecordingRequest,
  ): Promise<VoiceRecording> => {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('name', data.name)
    if (data.description) {
      formData.append('description', data.description)
    }
    return await apiClient
      .post('voice-recordings/upload', { body: formData })
      .json<VoiceRecording>()
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`voice-recordings/${id}`)
  },
}

export const useVoiceRecordings = (params: VoiceRecordingQueryParams = {}) => {
  return useQuery({
    queryKey: voiceRecordingsKeys.list(params),
    queryFn: () => voiceRecordingsApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

export const useUploadVoiceRecording = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: voiceRecordingsApi.upload,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: voiceRecordingsKeys.lists(),
      })
    },
  })
}

export const useDeleteVoiceRecording = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: voiceRecordingsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: voiceRecordingsKeys.lists(),
      })
    },
  })
}
