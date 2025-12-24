import { apiClient } from './client'
import type { ClientService } from './types/services.types'

export const servicesApi = {
  // Get active services for a client
  getClientServices: async (clientId: string): Promise<ClientService[]> => {
    return apiClient.get(`clients/${clientId}/services`).json<ClientService[]>()
  },

  // Create or enable a service
  createService: async (
    clientId: string,
    data: {
      serviceType: string
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
}
