import { PaginationParams } from '../types'

export enum SipExtensionType {
  USER = 'user',
  GOIP = 'goip',
}

export interface SipExtension {
  id: string
  transport: string
  aors: string
  auth: string
  context: string
  disallow: string
  allow: string
  dtmfMode: string
  rtpIpv6: string
  forceRport: string
  rtpSymmetric: string
  directMedia: string
  callerid: string
  trustIdInbound: string
  sendPai: string
  sendRpid: string
  aggregateMwi: string
  mediaEncryption: string
  inbandProgress: string
  identifyBy: string
  deviceStateBusyAt: number
  voicemailExtension: string | null
  mohSuggest: string | null
  iceSupport: string
  mailboxes: string | null
  rtcpMux: string
  webrtc: string
  useAvpf: string
  mediaUseReceivedTransport: string
  dtlsVerify: string
  dtlsSetup: string
  dtlsCertFile: string | null
  dtlsPrivateKey: string | null
  dtlsCaFile: string | null
  rewriteContact: string
  fromUser: string | null
  fromDomain: string | null
  trustIdOutbound: string | null
  userEqPhone: string | null
  dtlsAutoGenerateCert: string | null
  extensionType: string | null
  clientId: string | null
  assignedTo: {
    type: string
    id: string
    name: string
    email: string
  } | null
  client?: {
    id: string
    name: string
  } | null
  isGoipExtension: boolean
}

export interface SipExtensionsQueryParams extends PaginationParams {
  search?: string
  type?: SipExtensionType
  unassignedOnly?: boolean
}

export interface CreateSipExtensionRequest {
  id: string
  type: 'user' | 'goip'
  password: string
  clientId?: string | null
}

export interface BulkCreateSipExtensionRequest {
  rangeStart: number
  rangeEnd: number
  type: 'user' | 'goip'
}

export interface DeleteSipExtensionRequest {
  id: string
}
