import type { ServiceType } from './services.types'

export interface ServiceBalance {
  id: string
  clientServiceId: string
  balanceAmount: number | string | null
  balanceTokens: number | null
  currency: string
  lastTransactionAt: string | null
  isLowBalance: boolean
  lowBalanceThreshold: number | null
  unit: string
  createdAt: string
  updatedAt: string
}

export interface ClientServiceBalance {
  serviceType: ServiceType
  subscriptionType: 'prepaid' | 'postpaid'
  isEnabled: boolean
  balance: ServiceBalance | null
}

export interface ClientBalanceSummary {
  clientId: string
  balances: ClientServiceBalance[]
}
export interface TopUpBalanceMoneyPayload {
  amountMoney: number
  description?: string
  reference?: string
}

export interface TopUpBalanceTokensPayload {
  amountTokens: number
  description?: string
  reference?: string
}

export type TopUpBalancePayload =
  | TopUpBalanceMoneyPayload
  | TopUpBalanceTokensPayload

export interface CreateBalanceRequest {
  balanceAmount?: number
  balanceTokens?: number
  currency?: string
  lowBalanceThreshold?: number
}

export interface AdjustBalanceRequest {
  newBalanceTokens?: number
  newBalanceAmount?: number
  description?: string
}
