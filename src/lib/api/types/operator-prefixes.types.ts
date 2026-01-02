export interface OperatorPrefix {
  id: string
  prefix: string
  operatorName: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOperatorPrefixRequest {
  prefix: string
  operatorName: string
  description?: string | null
  isActive: boolean
}

export interface UpdateOperatorPrefixRequest {
  prefix?: string
  operatorName?: string
  description?: string | null
  isActive?: boolean
}

export interface OperatorPrefixesQueryParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}
