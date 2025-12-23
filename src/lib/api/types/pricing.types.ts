import type { PaginationParams } from '../types'

// Default Pricing entity
export interface DefaultPricing {
  id: string
  serviceType: string
  pricePerUnit: string
  unitType: string
  currency: string
  effectiveFrom: string
  effectiveUntil: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Request types
export interface CreateDefaultPricingRequest {
  serviceType: string
  pricePerUnit: string
  unitType: string
  currency: string
  effectiveFrom: string
  effectiveUntil?: string | null
  isActive?: boolean
}

export interface UpdateDefaultPricingRequest
  extends Partial<CreateDefaultPricingRequest> {}

// Query parameters
export interface DefaultPricingQueryParams extends PaginationParams {
  search?: string
  serviceType?: string
  isActive?: boolean
}
