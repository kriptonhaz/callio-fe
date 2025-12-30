export enum ServiceType {
  VOICE = 'voice',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export interface ClientService {
  id: string
  clientId: string
  serviceType: ServiceType
  subscriptionType: 'prepaid' | 'postpaid'
  isEnabled: boolean
  subscribedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateClientServiceRequest {
  serviceType: ServiceType
  isEnabled: boolean
  expiresAt?: string | null
}

export interface CreateClientServiceRequest {
  serviceType: ServiceType
  subscriptionType: 'prepaid' | 'postpaid'
  isEnabled: boolean
  expiresAt?: string | null
}
