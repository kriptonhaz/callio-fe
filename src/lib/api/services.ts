import { apiClient } from './client'
import type { ClientService } from './types/services.types'

export const servicesApi = {
  // Get all services for a client
  getClientServices: async (clientId: string): Promise<ClientService[]> => {
    return apiClient.get(`clients/${clientId}/services`).json<ClientService[]>()
  },

  // Get only enabled services for a client
  getEnabledServices: async (clientId: string): Promise<ClientService[]> => {
    return apiClient
      .get(`clients/${clientId}/services/enabled`)
      .json<ClientService[]>()
  },

  // Create or enable a service
  createService: async (
    clientId: string,
    data: {
      serviceType: string
      subscriptionType: 'prepaid' | 'postpaid'
      isEnabled: boolean
      expiresAt?: string | null
    },
  ): Promise<ClientService> => {
    return apiClient
      .post(`clients/${clientId}/services`, { json: data })
      .json<ClientService>()
  },

  // Update a service
  updateService: async (
    clientId: string,
    id: string,
    data: { isEnabled: boolean; expiresAt?: string | null },
  ): Promise<ClientService> => {
    return apiClient
      .patch(`clients/${clientId}/services/${id}`, { json: data })
      .json<ClientService>()
  },

  // Update a service by service type (PATCH by serviceType instead of id)
  updateServiceByType: async (
    clientId: string,
    serviceType: string,
    data: {
      subscriptionType: 'prepaid' | 'postpaid'
      isEnabled: boolean
      expiresAt?: string | null
    },
  ): Promise<ClientService> => {
    return apiClient
      .patch(`clients/${clientId}/services/${serviceType}`, { json: data })
      .json<ClientService>()
  },
}
