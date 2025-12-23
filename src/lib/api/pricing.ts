import { apiClient, buildQueryString } from './client'
import type {
  DefaultPricing,
  CreateDefaultPricingRequest,
  UpdateDefaultPricingRequest,
  DefaultPricingQueryParams,
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
