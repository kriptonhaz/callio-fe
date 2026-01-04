export interface MonitoringUser {
  id: string
  name: string
  email: string
  role: string
  clientId: string
  sipExtension: string
}

export interface RegisteredAgent {
  extension: string
  user: MonitoringUser
  status: 'online' | 'offline' | 'busy' | string
  channelIds: string[]
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface RegisteredAgentsResponse {
  data: RegisteredAgent[]
  meta: PaginationMeta
}

export interface ActiveCall {
  id: string
  phoneNumber: string
  sipChannel: string
  startTime: string
  duration?: number
  disposition?: string
  agent?: {
    id: string
    name: string
  }
  campaign?: {
    id: string
    name: string
  }
  lead?: {
    id: string
    leadName: string
    phone: string
  }
}

export interface ActiveCallsResponse {
  data: ActiveCall[]
  meta: PaginationMeta
}
