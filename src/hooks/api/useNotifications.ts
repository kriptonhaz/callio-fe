import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'
import type {
  NotificationsResponse,
  NotificationsQueryParams,
  BroadcastRequest,
} from '@/lib/api/types/notifications.types'

export const notificationsKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationsKeys.all, 'list'] as const,
  list: (params: NotificationsQueryParams) =>
    [...notificationsKeys.lists(), params] as const,
}

const notificationsApi = {
  getAll: async (
    params: NotificationsQueryParams,
  ): Promise<NotificationsResponse> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`notifications${queryString}`)
      .json<NotificationsResponse>()
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('notifications/read-all')
  },

  broadcast: async (data: BroadcastRequest): Promise<void> => {
    await apiClient.post('notifications/broadcast', { json: data })
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`notifications/${id}/read`)
  },
}

export const useNotifications = (
  params: NotificationsQueryParams = {},
): UseQueryResult<NotificationsResponse, Error> => {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsApi.getAll(params),
    // specific options can be adjusted here, e.g. refetchInterval if needed
  })
}

export const useMarkAllNotificationsRead = (): UseMutationResult<
  void,
  Error,
  void
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() })
    },
  })
}

export const useMarkNotificationRead = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() })
    },
  })
}

export const useBroadcastNotification = (): UseMutationResult<
  void,
  Error,
  BroadcastRequest
> => {
  return useMutation({
    mutationFn: notificationsApi.broadcast,
  })
}
