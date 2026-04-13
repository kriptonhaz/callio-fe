import {
  
  
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type {
  CreateLeadStatusOptionRequest,
  LeadStatusOption,
  UpdateLeadStatusOptionRequest,
} from '@/lib/api/types/lead-status-options.types'
import { apiClient } from '@/lib/api/client'

export const leadStatusOptionsKeys = {
  all: ['lead-status-options'] as const,
}

const api = {
  list: async (): Promise<Array<LeadStatusOption>> =>
    await apiClient.get('lead-status-options').json<Array<LeadStatusOption>>(),

  create: async (
    data: CreateLeadStatusOptionRequest,
  ): Promise<LeadStatusOption> =>
    await apiClient
      .post('lead-status-options', { json: data })
      .json<LeadStatusOption>(),

  update: async (
    id: string,
    data: UpdateLeadStatusOptionRequest,
  ): Promise<LeadStatusOption> =>
    await apiClient
      .patch(`lead-status-options/${id}`, { json: data })
      .json<LeadStatusOption>(),

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`lead-status-options/${id}`)
  },
}

export const useLeadStatusOptions = (): UseQueryResult<
  Array<LeadStatusOption>,
  Error
> =>
  useQuery({
    queryKey: leadStatusOptionsKeys.all,
    queryFn: api.list,
    staleTime: 5 * 60 * 1000,
  })

export const useCreateLeadStatusOption = (): UseMutationResult<
  LeadStatusOption,
  Error,
  CreateLeadStatusOptionRequest
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadStatusOptionsKeys.all })
    },
  })
}

export const useUpdateLeadStatusOption = (): UseMutationResult<
  LeadStatusOption,
  Error,
  { id: string; data: UpdateLeadStatusOptionRequest }
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadStatusOptionsKeys.all })
    },
  })
}

export const useDeleteLeadStatusOption = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadStatusOptionsKeys.all })
    },
  })
}
