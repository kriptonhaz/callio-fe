import {
  
  
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import type {UseMutationResult, UseQueryResult} from '@tanstack/react-query';
import type { PaginatedResponse } from '@/lib/api/types'
import type {
  CreateEmailAccountRequest,
  EmailAccount,
  EmailEnvelope,
  EmailFolder,
  EmailHistoryResponse,
  EmailMessage,
  OAuthStartResponse,
  SendEmailRequest,
  SendEmailResponse,
} from '@/lib/api/types/email.types'
import { apiClient, buildQueryString } from '@/lib/api/client'

export const emailKeys = {
  all: ['email'] as const,
  accounts: () => [...emailKeys.all, 'accounts'] as const,
  folders: (accountId: string) =>
    [...emailKeys.all, 'folders', accountId] as const,
  messages: (accountId: string, folder: string, page: number, limit: number) =>
    [...emailKeys.all, 'messages', accountId, folder, page, limit] as const,
  message: (accountId: string, folder: string, uid: number) =>
    [...emailKeys.all, 'message', accountId, folder, uid] as const,
  historyByAddress: (address: string, limit: number) =>
    [...emailKeys.all, 'history', address, limit] as const,
}

const api = {
  listAccounts: async (): Promise<Array<EmailAccount>> =>
    await apiClient.get('email-accounts').json<Array<EmailAccount>>(),

  createAccount: async (
    data: CreateEmailAccountRequest,
  ): Promise<EmailAccount> =>
    await apiClient.post('email-accounts', { json: data }).json<EmailAccount>(),

  deleteAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`email-accounts/${id}`)
  },

  listFolders: async (accountId: string): Promise<Array<EmailFolder>> =>
    await apiClient
      .get(`email-accounts/${accountId}/folders`)
      .json<Array<EmailFolder>>(),

  listMessages: async (
    accountId: string,
    folder: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<EmailEnvelope>> =>
    await apiClient
      .get(
        `email-accounts/${accountId}/messages${buildQueryString({ folder, page, limit })}`,
      )
      .json<PaginatedResponse<EmailEnvelope>>(),

  getMessage: async (
    accountId: string,
    folder: string,
    uid: number,
  ): Promise<EmailMessage> =>
    await apiClient
      .get(
        `email-accounts/${accountId}/messages/${uid}${buildQueryString({ folder })}`,
      )
      .json<EmailMessage>(),

  downloadAttachment: async (
    accountId: string,
    uid: number,
    partId: string,
    folder: string,
  ): Promise<Blob> => {
    const resp = await apiClient.get(
      `email-accounts/${accountId}/messages/${uid}/attachments/${partId}${buildQueryString({ folder })}`,
    )
    return resp.blob()
  },

  startGoogleOAuth: async (returnTo: string): Promise<OAuthStartResponse> =>
    await apiClient
      .get(
        `email-accounts/oauth/google/start${buildQueryString({ returnTo })}`,
      )
      .json<OAuthStartResponse>(),

  historyByAddress: async (
    address: string,
    limit: number,
  ): Promise<EmailHistoryResponse> =>
    await apiClient
      .get(
        `email-accounts/search/by-address${buildQueryString({ address, limit })}`,
      )
      .json<EmailHistoryResponse>(),

  sendMessage: async (
    accountId: string,
    data: SendEmailRequest,
  ): Promise<SendEmailResponse> => {
    const form = new FormData()
    form.append('to', JSON.stringify(data.to))
    if (data.cc && data.cc.length) form.append('cc', JSON.stringify(data.cc))
    if (data.bcc && data.bcc.length)
      form.append('bcc', JSON.stringify(data.bcc))
    form.append('subject', data.subject)
    if (data.text) form.append('text', data.text)
    if (data.html) form.append('html', data.html)
    if (data.inReplyTo) form.append('inReplyTo', data.inReplyTo)
    if (data.references) form.append('references', data.references)
    for (const file of data.attachments ?? []) {
      form.append('attachments', file, file.name)
    }
    return await apiClient
      .post(`email-accounts/${accountId}/messages/send`, { body: form })
      .json<SendEmailResponse>()
  },
}

export const useEmailAccounts = (): UseQueryResult<
  Array<EmailAccount>,
  Error
> =>
  useQuery({
    queryKey: emailKeys.accounts(),
    queryFn: api.listAccounts,
    staleTime: 60 * 1000,
  })

export const useCreateEmailAccount = (): UseMutationResult<
  EmailAccount,
  Error,
  CreateEmailAccountRequest
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.accounts() })
    },
  })
}

export const useDeleteEmailAccount = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.all })
    },
  })
}

export const useEmailFolders = (
  accountId: string | null | undefined,
): UseQueryResult<Array<EmailFolder>, Error> =>
  useQuery({
    queryKey: accountId
      ? emailKeys.folders(accountId)
      : [...emailKeys.all, 'folders', 'none'],
    queryFn: () => api.listFolders(accountId as string),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  })

export const useEmailMessages = (
  accountId: string | null | undefined,
  folder: string | null | undefined,
  page: number,
  limit: number,
): UseQueryResult<PaginatedResponse<EmailEnvelope>, Error> =>
  useQuery({
    queryKey:
      accountId && folder
        ? emailKeys.messages(accountId, folder, page, limit)
        : [...emailKeys.all, 'messages', 'none'],
    queryFn: () =>
      api.listMessages(accountId as string, folder as string, page, limit),
    enabled: !!accountId && !!folder,
    staleTime: 30 * 1000,
  })

export const useEmailMessage = (
  accountId: string | null | undefined,
  folder: string | null | undefined,
  uid: number | null | undefined,
): UseQueryResult<EmailMessage, Error> =>
  useQuery({
    queryKey:
      accountId && folder && uid != null
        ? emailKeys.message(accountId, folder, uid)
        : [...emailKeys.all, 'message', 'none'],
    queryFn: () =>
      api.getMessage(accountId as string, folder as string, uid as number),
    enabled: !!accountId && !!folder && uid != null,
    staleTime: 5 * 60 * 1000,
  })

export const useDownloadEmailAttachment = (): UseMutationResult<
  Blob,
  Error,
  { accountId: string; uid: number; partId: string; folder: string }
> =>
  useMutation({
    mutationFn: ({ accountId, uid, partId, folder }) =>
      api.downloadAttachment(accountId, uid, partId, folder),
  })

export const useStartGoogleOAuth = (): UseMutationResult<
  OAuthStartResponse,
  Error,
  string
> =>
  useMutation({
    mutationFn: (returnTo: string) => api.startGoogleOAuth(returnTo),
  })

export const useEmailHistoryByAddress = (
  address: string | null | undefined,
  limit = 50,
): UseQueryResult<EmailHistoryResponse, Error> =>
  useQuery({
    queryKey: address
      ? emailKeys.historyByAddress(address, limit)
      : [...emailKeys.all, 'history', 'none'],
    queryFn: () => api.historyByAddress(address as string, limit),
    enabled: !!address,
    staleTime: 60 * 1000,
  })

export const useSendEmail = (
  accountId: string | null | undefined,
): UseMutationResult<SendEmailResponse, Error, SendEmailRequest> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => {
      if (!accountId) return Promise.reject(new Error('No account selected'))
      return api.sendMessage(accountId, data)
    },
    onSuccess: () => {
      // Likely the Sent folder has a new item — clear cached messages list.
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'messages'] })
    },
  })
}
