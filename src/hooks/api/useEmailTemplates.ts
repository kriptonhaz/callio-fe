import {
  
  
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  CreateEmailTemplateRequest,
  EmailBlastJob,
  EmailBlastRequest,
  EmailBlastResponse,
  EmailTemplate,
  EmailTemplatesQueryParams,
  UpdateEmailTemplateRequest,
} from '@/lib/api/types/email.types'
import { apiClient, buildQueryString } from '@/lib/api/client'

export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  lists: () => [...emailTemplateKeys.all, 'list'] as const,
  list: (params: EmailTemplatesQueryParams) =>
    [...emailTemplateKeys.lists(), params] as const,
  detail: (id: string) => [...emailTemplateKeys.all, 'detail', id] as const,
  blastJob: (jobId: string) =>
    ['email-blast-jobs', 'detail', jobId] as const,
}

const api = {
  list: async (
    params: EmailTemplatesQueryParams,
  ): Promise<PaginatedResponse<EmailTemplate>> =>
    await apiClient
      .get(`email-templates${buildQueryString(params)}`)
      .json<PaginatedResponse<EmailTemplate>>(),

  get: async (id: string): Promise<EmailTemplate> =>
    await apiClient.get(`email-templates/${id}`).json<EmailTemplate>(),

  create: async (
    data: CreateEmailTemplateRequest,
  ): Promise<EmailTemplate> =>
    await apiClient
      .post('email-templates', { json: data })
      .json<EmailTemplate>(),

  update: async (
    id: string,
    data: UpdateEmailTemplateRequest,
  ): Promise<EmailTemplate> =>
    await apiClient
      .patch(`email-templates/${id}`, { json: data })
      .json<EmailTemplate>(),

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`email-templates/${id}`)
  },

  blast: async (
    accountId: string,
    data: EmailBlastRequest,
  ): Promise<EmailBlastResponse> =>
    await apiClient
      .post(`email-accounts/${accountId}/messages/blast`, { json: data })
      .json<EmailBlastResponse>(),

  getJob: async (jobId: string): Promise<EmailBlastJob> =>
    await apiClient.get(`email-blast-jobs/${jobId}`).json<EmailBlastJob>(),
}

export const useEmailTemplates = (
  params: EmailTemplatesQueryParams = {},
): UseQueryResult<PaginatedResponse<EmailTemplate>, Error> =>
  useQuery({
    queryKey: emailTemplateKeys.list(params),
    queryFn: () => api.list(params),
    staleTime: 30 * 1000,
  })

export const useEmailTemplate = (
  id: string | null | undefined,
): UseQueryResult<EmailTemplate, Error> =>
  useQuery({
    queryKey: id
      ? emailTemplateKeys.detail(id)
      : [...emailTemplateKeys.all, 'detail', 'none'],
    queryFn: () => api.get(id as string),
    enabled: !!id,
    staleTime: 30 * 1000,
  })

export const useCreateEmailTemplate = (): UseMutationResult<
  EmailTemplate,
  Error,
  CreateEmailTemplateRequest
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplateKeys.lists() })
    },
  })
}

export const useUpdateEmailTemplate = (): UseMutationResult<
  EmailTemplate,
  Error,
  { id: string; data: UpdateEmailTemplateRequest }
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.update(id, data),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: emailTemplateKeys.lists() })
      qc.setQueryData(emailTemplateKeys.detail(variables.id), data)
    },
  })
}

export const useDeleteEmailTemplate = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.remove,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: emailTemplateKeys.lists() })
      qc.removeQueries({ queryKey: emailTemplateKeys.detail(id) })
    },
  })
}

export const useSendEmailBlast = (
  accountId: string | null | undefined,
): UseMutationResult<EmailBlastResponse, Error, EmailBlastRequest> =>
  useMutation({
    mutationFn: (data) => {
      if (!accountId)
        return Promise.reject(new Error('No email account selected'))
      return api.blast(accountId, data)
    },
  })

// Polls every 2s while the job is in a non-terminal state (queued/sending),
// stops once it transitions to completed/failed/cancelled.
export const useEmailBlastJob = (
  jobId: string | null | undefined,
): UseQueryResult<EmailBlastJob, Error> =>
  useQuery({
    queryKey: jobId
      ? emailTemplateKeys.blastJob(jobId)
      : ['email-blast-jobs', 'detail', 'none'],
    queryFn: () => api.getJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      if (data.status === 'queued' || data.status === 'sending') return 2000
      return false
    },
  })
