import type { LeadStatus, PaginationParams } from '../types'

export interface Lead {
  id: string
  leadName: string
  phone: string
  email?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  dateOfBirth?: string | null
  occupation?: string | null
  jobTitle?: string | null
  companyName?: string | null
  officeAddress?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  customFields?: Record<string, string> | null
  tags?: string | null
  notes?: string | null
  status: LeadStatus
  clientId: string
  campaignIds?: string[] | null
  source?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateLeadRequest {
  clientId: string
  leadName: string
  phone: string
  email?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  dateOfBirth?: string | null
  occupation?: string | null
  jobTitle?: string | null
  companyName?: string | null
  officeAddress?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  customFields?: Record<string, string> | null
  tags?: string | null
  notes?: string | null
  campaignIds?: string[] | null
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

export interface LeadsQueryParams extends PaginationParams {
  search?: string
  status?: LeadStatus
  clientId?: string
  campaignId?: string
}
