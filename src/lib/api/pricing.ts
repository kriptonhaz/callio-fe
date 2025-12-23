import { apiClient, buildQueryString } from './client'
import type {
  DefaultPricing,
  CreateDefaultPricingRequest,
  UpdateDefaultPricingRequest,
  DefaultPricingQueryParams,
  ClientPricing,
  CreateClientPricingRequest,
  UpdateClientPricingRequest,
} from './types/pricing.types'
import type { PaginatedResponse } from './types'

export const pricingApi = {
  // Get active default pricings
  getActive: async (): Promise<DefaultPricing[]> => {
    return apiClient.get('pricing/defaults/active').json<DefaultPricing[]>()
  },

  // Get paginated default pricings
  getAll: async (
    params: DefaultPricingQueryParams = {},
  ): Promise<PaginatedResponse<DefaultPricing>> => {
    const queryString = buildQueryString(params)
    return apiClient
      .get(`pricing/defaults${queryString}`)
      .json<PaginatedResponse<DefaultPricing>>()
  },

  // Get single default pricing
  getById: async (id: string): Promise<DefaultPricing> => {
    return apiClient.get(`pricing/defaults/${id}`).json<DefaultPricing>()
  },

  // Create default pricing
  create: async (
    data: CreateDefaultPricingRequest,
  ): Promise<DefaultPricing> => {
    return apiClient
      .post('pricing/defaults', { json: data })
      .json<DefaultPricing>()
  },

  // Update default pricing
  update: async (
    id: string,
    data: UpdateDefaultPricingRequest,
  ): Promise<DefaultPricing> => {
    return apiClient
      .patch(`pricing/defaults/${id}`, { json: data })
      .json<DefaultPricing>()
  },

  // Delete default pricing
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`pricing/defaults/${id}`)
  },
}

// ============================================
// Client Pricing API
// ============================================
export const clientPricingApi = {
  // Get active pricing for a client
  getActive: async (clientId: string): Promise<ClientPricing[]> => {
    return apiClient
      .get(`clients/${clientId}/pricing/active`)
      .json<ClientPricing[]>()
  },

  // Create client pricing
  create: async (
    clientId: string,
    data: CreateClientPricingRequest,
  ): Promise<ClientPricing> => {
    return apiClient
      .post(`clients/${clientId}/pricing`, { json: data })
      .json<ClientPricing>()
  },

  // Update client pricing
  update: async (
    clientId: string,
    id: string,
    data: UpdateClientPricingRequest,
  ): Promise<ClientPricing> => {
    return apiClient
      .patch(`clients/${clientId}/pricing/${id}`, { json: data })
      .json<ClientPricing>()
  },

  // Delete client pricing
  delete: async (clientId: string, id: string): Promise<void> => {
    await apiClient.delete(`clients/${clientId}/pricing/${id}`)
  },
}
