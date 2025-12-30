import { apiClient } from './client'
import type {
  ClientBalanceSummary,
  ClientServiceBalance,
  ServiceBalance,
  TopUpBalancePayload,
  CreateBalanceRequest,
} from './types/balance.types'

export const balanceApi = {
  getClientBalanceSummary: async (
    clientId: string,
  ): Promise<ClientBalanceSummary> => {
    return apiClient
      .get(`clients/${clientId}/balance/summary`)
      .json<ClientBalanceSummary>()
  },

  topUpService: async (
    clientId: string,
    serviceType: string,
    payload: TopUpBalancePayload,
  ): Promise<ServiceBalance> => {
    return apiClient
      .post(`clients/${clientId}/services/${serviceType}/balance/add`, {
        json: payload,
      })
      .json<ServiceBalance>()
  },

  createBalance: async (
    clientId: string,
    serviceType: string,
    payload: CreateBalanceRequest,
  ): Promise<ServiceBalance> => {
    return apiClient
      .post(`clients/${clientId}/services/${serviceType}/balance`, {
        json: payload,
      })
      .json<ServiceBalance>()
  },

  getServiceBalance: async (
    clientId: string,
    serviceType: string,
  ): Promise<ClientServiceBalance | null> => {
    try {
      return await apiClient
        .get(`clients/${clientId}/services/${serviceType}/balance`)
        .json<ClientServiceBalance>()
    } catch (error) {
      // Return null if balance doesn't exist (404)
      return null
    }
  },

  adjustBalance: async (
    clientId: string,
    serviceType: string,
    payload: {
      newBalanceTokens?: number
      newBalanceAmount?: number
      description?: string
    },
  ): Promise<ServiceBalance> => {
    return apiClient
      .post(`clients/${clientId}/services/${serviceType}/balance/adjust`, {
        json: payload,
      })
      .json<ServiceBalance>()
  },
}
