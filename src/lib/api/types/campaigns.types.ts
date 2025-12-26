import type { CampaignStatus, PaginationParams } from '../types'
import type { ServiceType } from './services.types'

export interface Campaign {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  clientId: string
  createdBy: string
  startDate?: string
  endDate?: string
  serviceTypes?: ServiceType[]
  campaignServices?: { serviceType: ServiceType }[]
  createdAt: string
  updatedAt?: string
}

export interface CreateCampaignRequest {
  name: string
  description?: string
  status?: CampaignStatus
  clientId: string
  startDate?: string
  endDate?: string
  serviceTypes?: ServiceType[]
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}

export interface CampaignsQueryParams extends PaginationParams {
  search?: string
  status?: CampaignStatus
  clientId?: string
  createdBy?: string
}
