import type { LeadStatus, PaginationParams } from '../types'
import type { Lead } from './leads.types'

export enum LastCallStatus {
  ANSWERED = 'answered',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  VOICEMAIL = 'voicemail',
  WRONG_NUMBER = 'wrong_number',
  CALLBACK_REQUESTED = 'callback_requested',
  NOT_INTERESTED = 'not_interested',
  INTERESTED = 'interested',
  DISCONNECTED = 'disconnected',
  INVALID_NUMBER = 'invalid_number',
}

export interface ActiveCall {
  status: string
  agentId: string
  agentName: string
  startTime: string
  answerTime?: string
}

export interface LeadAssignment {
  id: string
  leadId: string
  campaignId: string
  clientId?: string
  assignedSupervisorId?: string | null
  assignedAgentId?: string | null
  status: LeadStatus
  lastCallStatus?: LastCallStatus | null
  leadProgressNotes?: string | null
  followupCount?: number | null
  lastContactedAt?: string | null
  nextFollowUpAt?: string | null
  createdAt: string
  updatedAt?: string
  lead?: Lead
  assignedSupervisor?: {
    id: string
    name: string
    email?: string
  }
  assignedAgent?: {
    id: string
    name: string
    email?: string
  }
  activeCall?: ActiveCall | null
  batchDate?: string | null
  previousAssignments?: PreviousAssignment[]
}

export interface PreviousAssignment {
  id: string
  batchDate: string
  status: LeadStatus
  lastCallStatus?: LastCallStatus | null
  leadProgressNotes?: string | null
  followupCount?: number | null
  assignedAgent?: {
    id: string
    name: string
  }
  assignedSupervisor?: {
    id: string
    name: string
  }
}

export interface UpdateLeadAssignmentRequest {
  leadId?: string
  clientId?: string
  campaignId?: string
  assignedSupervisorId?: string | null
  assignedAgentId?: string | null
  status?: LeadStatus
  lastCallStatus?: LastCallStatus | null
  leadProgressNotes?: string | null
  followupCount?: number | null
}

export interface LeadAssignmentsQueryParams extends PaginationParams {
  campaignId: string
  search?: string
  status?: LeadStatus
  agentId?: string
  batchDate?: string
}
