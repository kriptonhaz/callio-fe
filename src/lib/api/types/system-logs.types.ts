export interface SystemLogUser {
  id: string
  name: string
  email: string
}

export interface SystemLogMetadata {
  ip?: string
  method?: string
  [key: string]: any
}

export interface SystemLog {
  id: string
  userId: string
  action: string
  metadata: SystemLogMetadata
  createdAt: string
  user?: SystemLogUser
}

export interface SystemLogsMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SystemLogsResponse {
  data: SystemLog[]
  meta: SystemLogsMeta
}

export interface SystemLogsQueryParams {
  page?: number
  limit?: number
  userId?: string
  startDate?: string
  endDate?: string
}
