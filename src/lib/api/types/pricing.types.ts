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

// Client Pricing enums
export enum ServiceType {
  VOICE = 'voice',
  SMS = 'sms',
  DATA = 'data',
  WHATSAPP = 'whatsapp',
  AI = 'ai',
}

export enum UnitType {
  SECOND = 'second',
  MINUTE = 'minute',
  MESSAGE = 'message',
  MB = 'mb',
  GB = 'gb',
}

export enum Currency {
  IDR = 'IDR',
  USD = 'USD',
}

// Client Pricing entity
export interface SalesPerson {
  id: string
  name: string
}

export interface ClientPricing {
  id: string
  clientId: string
  serviceType: ServiceType
  pricePerUnit: string
  unitType: UnitType
  currency: Currency
  salesPersonId: string
  effectiveFrom: string
  effectiveUntil: string | null
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  salesPerson: SalesPerson
}

// Client Pricing Request types
export interface CreateClientPricingRequest {
  clientId: string
  serviceType: ServiceType
  pricePerUnit: string
  unitType: UnitType
  currency: Currency
  salesPersonId: string
  effectiveFrom: string
  effectiveUntil?: string | null
  notes?: string | null
}

export interface UpdateClientPricingRequest {
  serviceType?: ServiceType
  pricePerUnit?: string
  unitType?: UnitType
  currency?: Currency
  salesPersonId?: string
  effectiveFrom?: string
  effectiveUntil?: string | null
  isActive?: boolean
  notes?: string | null
}

// Client Pricing Query parameters
export interface ClientPricingQueryParams extends PaginationParams {
  clientId?: string
  isActive?: boolean
}

// Pricing Source enum
export enum PricingSource {
  CUSTOM = 'custom',
  DEFAULT = 'default',
}

// Effective Pricing entity (for getEffective endpoint)
export interface EffectivePricing {
  serviceType: ServiceType
  pricePerUnit: number
  unitType: UnitType
  currency: Currency
  pricingSource: PricingSource
  pricingId: string
  effectiveFrom: string
  salesPerson: SalesPerson | null
}

// Update Effective Pricing Request
export interface UpdateEffectivePricingRequest {
  serviceType: ServiceType
  pricePerUnit: number
  unitType: UnitType
  currency: Currency
  salesPersonId: string | null
  effectiveFrom: string
  effectiveUntil?: string | null
  notes?: string | null
}
