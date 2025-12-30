export interface SipConnectionStatusResponse {
  connected: boolean
  extension: string
  status: 'online' | 'offline' | 'in_call'
  channelIds: string[]
}
