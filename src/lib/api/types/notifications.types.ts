export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  category: string
  isRead: boolean
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface NotificationsMeta {
  page: number
  limit: number
  total: number
  unreadCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface NotificationsResponse {
  data: Notification[]
  meta: NotificationsMeta
}

export interface NotificationsQueryParams {
  page?: number
  limit?: number
  isRead?: boolean
}

export interface BroadcastRequest {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  category: string
  targetClientId?: string | null
  targetRole?: string | null
  targetUserId?: string | null
  payload?: Record<string, any>
}
