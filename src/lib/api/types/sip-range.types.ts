export interface AssignSipRangeRequest {
  clientId: string
  rangeStart: number
  rangeEnd: number
}

export interface AssignSipRangeResponse {
  message: string
  clientId: string
  clientName: string
  rangeStart: number
  rangeEnd: number
  affectedCount: number
}

export interface ClientExtensionRangeResponse {
  clientId: string
  clientName: string
  hasExtensions: boolean
  rangeStart: number | null
  rangeEnd: number | null
  totalExtensions: number
}
