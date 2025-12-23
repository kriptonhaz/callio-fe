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
