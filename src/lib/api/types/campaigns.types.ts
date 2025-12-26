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
  client?: {
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
    status?: string
  }
  creator?: {
    id: string
    name: string
    email?: string
  }
  _count?: {
    leadAssignments: number
  }
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
