import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { balanceApi } from '@/lib/api/balance'

export const useClientBalanceSummary = (clientId: string) => {
  return useQuery({
    queryKey: ['clientBalance', clientId],
    queryFn: () => balanceApi.getClientBalanceSummary(clientId),
    enabled: !!clientId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })
}

export const useTopUpBalance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      serviceType,
      payload,
    }: {
      clientId: string
      serviceType: string
      payload: any // Types handled by API function
    }) => balanceApi.topUpService(clientId, serviceType, payload),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clientBalance', clientId] })
    },
  })
}

export const useCreateBalance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      serviceType,
      payload,
    }: {
      clientId: string
      serviceType: string
      payload: any
    }) => balanceApi.createBalance(clientId, serviceType, payload),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clientBalance', clientId] })
    },
  })
}

export const useAdjustBalance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      serviceType,
      payload,
    }: {
      clientId: string
      serviceType: string
      payload: any
    }) => balanceApi.adjustBalance(clientId, serviceType, payload),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clientBalance', clientId] })
    },
  })
}
