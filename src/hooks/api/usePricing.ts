import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { pricingApi } from '@/lib/api/pricing'
import type {
  DefaultPricing,
  CreateDefaultPricingRequest,
  UpdateDefaultPricingRequest,
  DefaultPricingQueryParams,
} from '@/lib/api/types/pricing.types'
import type { PaginatedResponse } from '@/lib/api/types'

// Query keys
export const pricingKeys = {
  all: ['pricings'] as const,
  lists: () => [...pricingKeys.all, 'list'] as const,
  list: (params: DefaultPricingQueryParams) =>
    [...pricingKeys.lists(), params] as const,
  active: () => [...pricingKeys.all, 'active'] as const,
  details: () => [...pricingKeys.all, 'detail'] as const,
  detail: (id: string) => [...pricingKeys.details(), id] as const,
}

// Get active default pricings
export const useActivePricings = (): UseQueryResult<
  DefaultPricing[],
  Error
> => {
  return useQuery({
    queryKey: pricingKeys.active(),
    queryFn: pricingApi.getActive,
  })
}

// Get paginated default pricings
export const usePricings = (
  params: DefaultPricingQueryParams = {},
): UseQueryResult<PaginatedResponse<DefaultPricing>, Error> => {
  return useQuery({
    queryKey: pricingKeys.list(params),
    queryFn: () => pricingApi.getAll(params),
  })
}

// Get single default pricing
export const usePricing = (
  id: string,
): UseQueryResult<DefaultPricing, Error> => {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => pricingApi.getById(id),
    enabled: !!id,
  })
}

// Create default pricing
export const useCreatePricing = (): UseMutationResult<
  DefaultPricing,
  Error,
  CreateDefaultPricingRequest
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: pricingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pricingKeys.active() })
    },
  })
}

// Update default pricing
export const useUpdatePricing = (): UseMutationResult<
  DefaultPricing,
  Error,
  { id: string; data: UpdateDefaultPricingRequest }
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => pricingApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pricingKeys.active() })
      queryClient.setQueryData(pricingKeys.detail(variables.id), data)
    },
  })
}

// Delete default pricing
export const useDeletePricing = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: pricingApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pricingKeys.active() })
      queryClient.removeQueries({ queryKey: pricingKeys.detail(id) })
    },
  })
}

// ============================================
// Client Pricing Hooks
// ============================================

import { clientPricingApi } from '@/lib/api/pricing'
import type {
  ClientPricing,
  CreateClientPricingRequest,
  UpdateClientPricingRequest,
  EffectivePricing,
  UpdateEffectivePricingRequest,
} from '@/lib/api/types/pricing.types'

// Query keys for client pricing
export const clientPricingKeys = {
  all: ['clientPricing'] as const,
  lists: () => [...clientPricingKeys.all, 'list'] as const,
  list: (clientId: string) => [...clientPricingKeys.lists(), clientId] as const,
}

// Get effective pricing for a client (includes custom and default pricing)
export function useClientPricing(
  clientId: string,
): UseQueryResult<EffectivePricing[], Error> {
  return useQuery({
    queryKey: clientPricingKeys.list(clientId),
    queryFn: () => clientPricingApi.getEffective(clientId),
    enabled: !!clientId,
  })
}

// Update effective pricing for a client
export function useUpdateEffectivePricing(): UseMutationResult<
  void,
  Error,
  { clientId: string; data: UpdateEffectivePricingRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, data }) =>
      clientPricingApi.updateEffective(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientPricingKeys.list(variables.clientId),
      })
    },
  })
}

// Create client pricing
export function useCreateClientPricing(): UseMutationResult<
  ClientPricing,
  Error,
  { clientId: string; data: CreateClientPricingRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, data }) => clientPricingApi.create(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientPricingKeys.list(variables.clientId),
      })
    },
  })
}

// Update client pricing
export function useUpdateClientPricing(): UseMutationResult<
  ClientPricing,
  Error,
  { clientId: string; id: string; data: UpdateClientPricingRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, id, data }) =>
      clientPricingApi.update(clientId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientPricingKeys.list(variables.clientId),
      })
    },
  })
}

// Delete client pricing
export function useDeleteClientPricing(): UseMutationResult<
  void,
  Error,
  { clientId: string; id: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, id }) => clientPricingApi.delete(clientId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientPricingKeys.list(variables.clientId),
      })
    },
  })
}
