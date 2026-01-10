import type {
  PaginationParams,
  CallDirection,
  CallStatus,
  PaymentStatus,
} from '../types'

// Lead Assignments
export interface LeadAssignment {
  id: string
  leadId: string
  campaignId: string
  assignedAgentId: string
  assignedSupervisorId?: string
  status: string
  createdAt: string
  updatedAt?: string
}

export interface CreateLeadAssignmentRequest {
  leadId: string
  campaignId: string
  assignedAgentId: string
  assignedSupervisorId?: string
  status?: string
}

export interface UpdateLeadAssignmentRequest
  extends Partial<CreateLeadAssignmentRequest> {}

export interface LeadAssignmentsQueryParams extends PaginationParams {
  status?: string
  leadId?: string
  campaignId?: string
  assignedAgentId?: string
  assignedSupervisorId?: string
}

// Recordings
export interface Recording {
  id: string
  agentId: string
  leadId?: string
  supervisorId?: string
  fileUrl: string
  durationSeconds: number
  transcript?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateRecordingRequest {
  agentId: string
  leadId?: string
  supervisorId?: string
  fileUrl: string
  durationSeconds: number
  transcript?: string
}

export interface UpdateRecordingRequest
  extends Partial<CreateRecordingRequest> {}

export interface RecordingsQueryParams extends PaginationParams {
  search?: string
  agentId?: string
  leadId?: string
  supervisorId?: string
}

// Call Logs
export interface CallLogAgent {
  id: string
  name: string
}

export interface CallLogCampaign {
  id: string
  name: string
}

export interface CallLogLead {
  id: string
  leadName: string
  phone: string
}

export interface CallLogClient {
  id: string
  name: string
}

export interface CallLog {
  id: string
  agentId: string
  clientId: string
  leadId?: string | null
  campaignId?: string | null
  phoneNumber: string
  goipPortId?: string | null
  direction: CallDirection
  callType: 'regular' | 'voiceblast'
  status: CallStatus
  disposition?: string | null
  startTime: string
  answerTime?: string | null
  endTime?: string | null
  durationSeconds?: number | null
  billableSeconds?: number | null
  sipChannel?: string | null
  bridgeId?: string | null
  recordingPath?: string | null
  recordingDuration?: number | null
  sessionToken?: string | null
  createdAt: string
  updatedAt?: string
  // Nested relations
  agent?: CallLogAgent
  client?: CallLogClient
  campaign?: CallLogCampaign | null
  lead?: CallLogLead | null
}

export interface CreateCallLogRequest {
  agentId: string
  leadId?: string
  direction: CallDirection
  status: CallStatus
  startTime: string
  endTime?: string
  durationSeconds?: number
  sipChannel?: string
}

export interface UpdateCallLogRequest extends Partial<CreateCallLogRequest> {}

export interface CallLogsQueryParams extends PaginationParams {
  direction?: CallDirection
  status?: CallStatus
  disposition?: string
  agentId?: string
  leadId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
}

// System Logs
export interface SystemLog {
  id: string
  userId?: string
  action: string
  entity: string
  entityId?: string
  details?: string
  createdAt: string
}

export interface CreateSystemLogRequest {
  userId?: string
  action: string
  entity: string
  entityId?: string
  details?: string
}

export interface SystemLogsQueryParams extends PaginationParams {
  userId?: string
  action?: string
  entity?: string
}

// Payment History
export interface PaymentHistory {
  id: string
  clientId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  period?: string // e.g., "Jan 2025"
  status: PaymentStatus
  createdAt: string
  updatedAt?: string
}

export interface CreatePaymentHistoryRequest {
  clientId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status?: PaymentStatus
}

export interface UpdatePaymentHistoryRequest
  extends Partial<CreatePaymentHistoryRequest> {}

export interface PaymentHistoryQueryParams extends PaginationParams {
  clientId?: string
  status?: PaymentStatus
}

// Supervisor Coaching Notes
export interface CoachingNote {
  id: string
  supervisorId: string
  agentId: string
  leadId?: string
  notes: string
  rating?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateCoachingNoteRequest {
  supervisorId: string
  agentId: string
  leadId?: string
  notes: string
  rating?: number
}

export interface UpdateCoachingNoteRequest
  extends Partial<CreateCoachingNoteRequest> {}

export interface CoachingNotesQueryParams extends PaginationParams {
  supervisorId?: string
  agentId?: string
  leadId?: string
}

// Lead History
export interface LeadHistory {
  id: string
  leadId: string
  agentId?: string
  action: string
  details?: string
  createdAt: string
}

export interface CreateLeadHistoryRequest {
  leadId: string
  agentId?: string
  action: string
  details?: string
}

export interface LeadHistoryQueryParams extends PaginationParams {
  leadId?: string
  agentId?: string
  action?: string
}

// VoIP Analytics Types
export interface VoipAnalyticsQueryParams {
  clientId?: string
  startDate?: string
  endDate?: string
}

export interface VoipAnalyticsSummary {
  totalCalls: number
  totalDurationMinutes: number
  answeredCalls: number
  unansweredCalls: number
  answerRate: number
}

export interface VoipHourlyVolume {
  hour: number
  total: number
  answered: number
  unanswered: number
}

export interface VoipTopAgent {
  agentId: string
  agentName: string
  totalCalls: number
  totalDurationMinutes: number
  answerRate: number
}

export interface VoipAnalyticsResponse {
  summary: VoipAnalyticsSummary
  hourlyVolumeToday: VoipHourlyVolume[]
  topAgents: VoipTopAgent[]
}
