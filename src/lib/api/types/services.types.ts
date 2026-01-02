export enum ServiceType {
  VOICE = 'voice',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  AI = 'ai',
}

export interface ClientService {
  id?: string
  clientId?: string
  serviceType: ServiceType | string
  subscriptionType: 'prepaid' | 'postpaid' | null
  isEnabled: boolean
  subscribedAt?: string | null
  expiresAt?: string | null
  createdAt?: string
  updatedAt?: string
  subscribed?: boolean
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
