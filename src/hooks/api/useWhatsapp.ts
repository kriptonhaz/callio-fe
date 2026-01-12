import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  WhatsAppInstance,
  WhatsAppInstancesResponse,
  CreateWhatsAppInstanceRequest,
  UpdateWhatsAppInstanceRequest,
  WhatsAppMessage,
  SendMessageRequest,
  BlastWhatsAppRequest,
  WhatsAppChat,
} from '@/lib/api/types/whatsapp.types'

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  instances: () => [...whatsappKeys.all, 'instances'] as const,
  qr: (id: string) => [...whatsappKeys.all, 'qr', id] as const,
  chats: (instanceId: string) =>
    [...whatsappKeys.all, 'chats', instanceId] as const,
  messages: (instanceId: string, remoteJid?: string) =>
    [...whatsappKeys.all, 'messages', instanceId, remoteJid] as const,
}

const whatsappApi = {
  getInstances: async (): Promise<WhatsAppInstance[]> => {
    const response = await apiClient
      .get('whatsapp/instances')
      .json<WhatsAppInstancesResponse>()
    return response.data
  },
  getInstanceById: async (id: string): Promise<WhatsAppInstance> => {
    return await apiClient
      .get(`whatsapp/instances/${id}`)
      .json<WhatsAppInstance>()
  },

  createInstance: async (
    data: CreateWhatsAppInstanceRequest,
  ): Promise<WhatsAppInstance> => {
    return await apiClient
      .post('whatsapp/instances', { json: data })
      .json<WhatsAppInstance>()
  },

  updateInstance: async ({
    id,
    data,
  }: {
    id: string
    data: UpdateWhatsAppInstanceRequest
  }): Promise<WhatsAppInstance> => {
    return await apiClient
      .patch(`whatsapp/instances/${id}`, { json: data })
      .json<WhatsAppInstance>()
  },

  deleteInstance: async (id: string): Promise<void> => {
    await apiClient.delete(`whatsapp/instances/${id}`)
  },

  connectInstance: async (id: string): Promise<void> => {
    await apiClient.post(`whatsapp/instances/${id}/connect`)
  },

  getQR: async (
    id: string,
  ): Promise<{ qrCode: string | null; status: string }> => {
    const response = await apiClient
      .get(`whatsapp/instances/${id}/qr`)
      .json<{ qrCode: string | null; status: string }>()
    return response
  },

  getChats: async (instanceId: string): Promise<WhatsAppChat[]> => {
    const response = await apiClient
      .get(`whatsapp/instances/${instanceId}/chats`)
      .json<WhatsAppChat[]>()
    return response
  },

  getMessages: async (
    instanceId: string,
    remoteJid?: string,
  ): Promise<WhatsAppMessage[]> => {
    const searchParams = remoteJid ? { remoteJid } : undefined
    const response = await apiClient
      .get(`whatsapp/messages/history/${instanceId}`, { searchParams })
      .json<{ data: WhatsAppMessage[] }>()
    return response.data
  },

  sendMessage: async (data: SendMessageRequest): Promise<WhatsAppMessage> => {
    return await apiClient
      .post('whatsapp/messages/send', { json: data })
      .json<WhatsAppMessage>()
  },

  markAsRead: async (instanceId: string, jid: string): Promise<void> => {
    await apiClient.post(`whatsapp/instances/${instanceId}/chats/${jid}/read`)
  },

  uploadMedia: async (
    instanceId: string,
    file: File,
  ): Promise<{ filename: string; mediaUrl: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    return await apiClient
      .post(`whatsapp/messages/upload/${instanceId}`, { body: formData })
      .json<{ filename: string; mediaUrl: string }>()
  },

  blastWhatsApp: async (data: BlastWhatsAppRequest): Promise<void> => {
    await apiClient.post('whatsapp/messages/blast', { json: data })
  },
}

export const useWhatsAppInstances = () =>
  useQuery({
    queryKey: whatsappKeys.instances(),
    queryFn: whatsappApi.getInstances,
    staleTime: 30 * 1000,
  })

export const useWhatsAppInstance = (id: string) =>
  useQuery({
    queryKey: [...whatsappKeys.instances(), id],
    queryFn: () => whatsappApi.getInstanceById(id),
    enabled: !!id,
  })

export const useCreateWhatsAppInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: whatsappApi.createInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
    },
  })
}

export const useUpdateWhatsAppInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: whatsappApi.updateInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
    },
  })
}

export const useDeleteWhatsAppInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: whatsappApi.deleteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.instances() })
    },
  })
}

export const useConnectWhatsAppInstance = () => {
  return useMutation({
    mutationFn: whatsappApi.connectInstance,
  })
}

export const useWhatsAppQR = (id: string | null) =>
  useQuery({
    queryKey: whatsappKeys.qr(id!),
    queryFn: () => whatsappApi.getQR(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Stop polling when connected or qrCode is null
      if (
        query.state.data?.status === 'connected' ||
        query.state.data?.qrCode === null
      ) {
        return false
      }
      // Poll every 3 seconds
      return 3000
    },
    staleTime: 0,
  })

export const useWhatsAppChats = (instanceId: string) =>
  useQuery({
    queryKey: whatsappKeys.chats(instanceId),
    queryFn: () => whatsappApi.getChats(instanceId),
    enabled: !!instanceId,
    refetchInterval: 3000,
    staleTime: 3000, // Sync staleTime with refetchInterval for consistent updates
  })

export const useWhatsAppMessages = (
  instanceId: string,
  remoteJid: string | null,
) =>
  useQuery({
    queryKey: whatsappKeys.messages(instanceId, remoteJid || undefined),
    queryFn: () => whatsappApi.getMessages(instanceId, remoteJid || undefined),
    enabled: !!instanceId && !!remoteJid,
    refetchInterval: 3000,
    staleTime: 3000,
  })

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: whatsappApi.sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.messages(variables.instanceId, variables.to),
      })
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.chats(variables.instanceId),
      })
    },
  })
}

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ instanceId, jid }: { instanceId: string; jid: string }) =>
      whatsappApi.markAsRead(instanceId, jid),
    onSuccess: (_, { instanceId, jid }) => {
      // Optimistically update the unread count in the chats list
      queryClient.setQueryData(
        whatsappKeys.chats(instanceId),
        (old: WhatsAppChat[] | undefined) => {
          if (!old) return old
          return old.map((chat) =>
            chat.jid === jid ? { ...chat, unreadCount: 0 } : chat,
          )
        },
      )
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.chats(instanceId),
      })
    },
  })
}

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: ({ instanceId, file }: { instanceId: string; file: File }) =>
      whatsappApi.uploadMedia(instanceId, file),
  })
}

export const useBlastWhatsApp = () => {
  return useMutation({
    mutationFn: whatsappApi.blastWhatsApp,
  })
}
