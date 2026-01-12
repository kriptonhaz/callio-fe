export interface WhatsAppInstance {
  id: string
  clientId: string
  name: string
  providerType: 'baileys' | 'official'
  status: 'connected' | 'disconnected'
  phoneNumber: string
  autoReplyEnabled: boolean
  autoReplyMode: 'all' | 'whitelist' | 'blacklist'
  autoReplyWhitelist: WhatsAppRuleContact[]
  autoReplyBlacklist: WhatsAppRuleContact[]
  aiSystemPrompt: string | null
  aiModelId: string | null
  webhookEnabled: boolean
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
  }
  _count: {
    messages: number
    knowledgeBase: number
    webhooks: number
  }
}

export interface WhatsAppInstancesResponse {
  data: WhatsAppInstance[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface CreateWhatsAppInstanceRequest {
  name: string
  providerType: 'baileys' | 'official'
  accessToken?: string
  phoneNumberId?: string
  businessAccountId?: string
}

export interface UpdateWhatsAppInstanceRequest {
  name?: string
  autoReplyEnabled?: boolean
  autoReplyMode?: 'all' | 'whitelist' | 'blacklist'
  autoReplyWhitelist?: WhatsAppRuleContact[]
  autoReplyBlacklist?: WhatsAppRuleContact[]
  aiSystemPrompt?: string | null
  aiModelId?: string | null
  webhookEnabled?: boolean
}

export interface WhatsAppRuleContact {
  name: string
  jid: string
}

export interface WhatsAppQRResponse {
  qrCode: string
  status: string
}

export interface WhatsAppMessage {
  id: string
  instanceId: string
  remoteJid: string
  messageId: string
  senderJid: string | null
  senderName: string | null
  senderProfilePicUrl?: string | null
  direction: 'inbound' | 'outbound'
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
  content: string
  mediaUrl: string | null
  mediaMimeType: string | null
  status: 'sent' | 'delivered' | 'read' | 'failed'
  isBlast: boolean
  blastBatchId: string | null
  scheduledAt: string | null
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  failedAt: string | null
  errorMessage: string | null
  createdAt: string
}

export interface WhatsAppContact {
  id: string
  remoteJid: string
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export interface SendMessageRequest {
  instanceId: string
  to: string
  content: string
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
  mediaUrl?: string
  scheduledAt?: string
}

export interface BlastWhatsAppRequest {
  instanceId: string
  recipients: string[]
  content: string
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
  scheduledAt?: string
  mediaUrl?: string
  mediaMimeType?: string
  mediaName?: string
}

export interface WhatsAppChat {
  id: string
  jid: string
  name: string
  profilePicUrl: string | null
  isGroup: boolean
  unreadCount: number
  lastMessage: {
    content: string
    direction: 'inbound' | 'outbound'
    timestamp: string
    type: string
  } | null
}
