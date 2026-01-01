export interface IpWhitelistResponse {
  clientId: string
  clientName: string
  ipWhitelist: string | null
  apiAccessEnabled: boolean
}

export interface UpdateIpWhitelistRequest {
  ipWhitelist: string
}

export interface SmsMasking {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    clientMaskings: number
  }
  clientMaskings: Array<{
    isPrimary: boolean
  }>
}

export interface SmsMaskingListResponse {
  data: SmsMasking[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateSmsMaskingRequest {
  clientId: string
  name: string
  description?: string
  isActive: boolean
  isPrimary: boolean
}

export interface UpdateSmsMaskingRequest {
  name: string
  description?: string
  isActive: boolean
  isPrimary: boolean
}
