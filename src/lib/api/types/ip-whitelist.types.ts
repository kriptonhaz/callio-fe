export interface IpWhitelistResponse {
  clientId: string
  clientName: string
  ipWhitelist: string | null
  apiAccessEnabled: boolean
}

export interface UpdateIpWhitelistRequest {
  ipWhitelist: string
}
