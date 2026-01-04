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
  agentId: string
  clientId: string
  leadId: string
  campaignId: string
  phoneNumber: string
  goipPortId: string | null
  direction: 'inbound' | 'outbound'
  status: 'ringing' | 'connected' | 'hold' | string
  disposition: string | null
  startTime: string
  answerTime: string | null
  endTime: string | null
  durationSeconds: number
  billableSeconds: number
  sipChannel: string
  bridgeId: string | null
  recordingPath: string | null
  recordingDuration: number | null
  sessionToken: string | null
  createdAt: string
  agent: {
    id: string
    name: string
    sipExtension: string
  }
  client: {
    id: string
    name: string
  }
  campaign: {
    id: string
    name: string
  }
  lead: {
    id: string
    leadName: string
    phone: string
  }
}

export interface ActiveCallsResponse {
  data: ActiveCall[]
}

export type MonitorMode = 'spy' | 'whisper' | 'barge'

export interface StartMonitorRequest {
  mode: MonitorMode
  supervisorExtension: string
}
