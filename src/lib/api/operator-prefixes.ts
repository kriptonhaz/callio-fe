import { apiClient, buildQueryString } from './client'
import type { PaginatedResponse } from './types'
import type {
  OperatorPrefix,
  CreateOperatorPrefixRequest,
  UpdateOperatorPrefixRequest,
  OperatorPrefixesQueryParams,
} from './types/operator-prefixes.types'

export const operatorPrefixesApi = {
  getAll: async (
    params: OperatorPrefixesQueryParams = {},
  ): Promise<PaginatedResponse<OperatorPrefix>> => {
    const queryString = buildQueryString(params)
    return await apiClient
      .get(`operator-prefixes${queryString}`)
      .json<PaginatedResponse<OperatorPrefix>>()
  },

  getById: async (id: string): Promise<OperatorPrefix> => {
    return await apiClient.get(`operator-prefixes/${id}`).json<OperatorPrefix>()
  },

  create: async (
    data: CreateOperatorPrefixRequest,
  ): Promise<OperatorPrefix> => {
    return await apiClient
      .post('operator-prefixes', { json: data })
      .json<OperatorPrefix>()
  },

  update: async (
    id: string,
    data: UpdateOperatorPrefixRequest,
  ): Promise<OperatorPrefix> => {
    return await apiClient
      .patch(`operator-prefixes/${id}`, { json: data })
      .json<OperatorPrefix>()
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`operator-prefixes/${id}`)
  },
}
