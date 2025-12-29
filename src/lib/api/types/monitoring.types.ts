export interface MonitoringUser {
  id: string
  name: string
  email: string
  role: string
}

export interface RegisteredAgent {
  extension: string
  user: MonitoringUser
  status: 'online' | 'offline' | 'busy' // Assuming status values, will allow string for flexibility
  channelIds: string[]
}

export interface RegisteredAgentsResponse {
  registered: RegisteredAgent[]
  total: number
}
