import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { servicesApi } from '@/lib/api/services'
import type { ClientService } from '@/lib/api/types/services.types'

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  client: (clientId: string) => [...serviceKeys.lists(), clientId] as const,
}

export function useClientServices(
  clientId: string,
): UseQueryResult<ClientService[], Error> {
  return useQuery({
    queryKey: serviceKeys.client(clientId),
    queryFn: () => servicesApi.getClientServices(clientId),
    enabled: !!clientId,
  })
}

export function useEnabledServices(
  clientId: string | undefined,
): UseQueryResult<ClientService[], Error> {
  return useQuery({
    queryKey: [...serviceKeys.client(clientId || ''), 'enabled'] as const,
    queryFn: () => servicesApi.getEnabledServices(clientId!),
    enabled: !!clientId,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string
      data: {
        serviceType: string
        isEnabled: boolean
        expiresAt?: string | null
      }
    }) => servicesApi.createService(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.client(variables.clientId),
      })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      id,
      data,
    }: {
      clientId: string
      id: string
      data: { isEnabled: boolean; expiresAt?: string | null }
    }) => servicesApi.updateService(clientId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: serviceKeys.client(variables.clientId),
      })
    },
  })
}
