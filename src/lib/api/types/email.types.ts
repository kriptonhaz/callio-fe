export type EmailAccountProvider = 'google' | 'imap_password'

export interface EmailAccount {
  id: string
  email: string
  displayName: string
  provider: EmailAccountProvider
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean | null
  username: string
  lastConnectedAt: string | null
  lastErrorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface OAuthStartResponse {
  authUrl: string
}

export interface CreateEmailAccountRequest {
  email: string
  displayName: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
}

export interface SendEmailRequest {
  to: Array<string>
  cc?: Array<string>
  bcc?: Array<string>
  subject: string
  text?: string
  html?: string
  inReplyTo?: string
  references?: string
  attachments?: Array<File>
}

export interface SendEmailResponse {
  messageId: string
  accepted: Array<string>
  rejected: Array<string>
}

export interface EmailFolder {
  path: string
  name: string
  specialUse: string | null
  flags: Array<string>
}

export interface EmailAddress {
  name: string | null
  address: string
}

export interface EmailEnvelope {
  uid: number
  subject: string
  from: Array<EmailAddress>
  to: Array<EmailAddress>
  date: string
  flags: Array<string>
  seen: boolean
  hasAttachments: boolean
  size: number
}

export interface EmailAttachment {
  partId: string
  filename: string
  contentType: string
  size: number
}

export interface EmailMessage {
  uid: number
  subject: string
  from: Array<EmailAddress>
  to: Array<EmailAddress>
  cc: Array<EmailAddress>
  date: string
  flags: Array<string>
  bodyHtml: string | null
  bodyText: string | null
  attachments: Array<EmailAttachment>
}

export interface EmailMessagesQueryParams {
  folder: string
  page?: number
  limit?: number
}

export interface EmailHistoryAccountStatus {
  id: string
  email: string
  ok: boolean
  error?: string
}

export interface EmailHistoryEnvelope {
  accountId: string
  accountEmail: string
  folder: string
  direction: 'inbound' | 'outbound'
  uid: number
  subject: string
  from: Array<EmailAddress>
  to: Array<EmailAddress>
  date: string
  flags: Array<string>
  seen: boolean
  hasAttachments: boolean
  size: number
}

export interface EmailHistoryResponse {
  accounts: Array<EmailHistoryAccountStatus>
  messages: Array<EmailHistoryEnvelope>
}
