// VoIP Analytics Types

export interface VoipSummary {
  totalCalls: number
  totalDurationMinutes: number
  answeredCalls: number
  unansweredCalls: number
  answerRate: number
  avgCallDurationSeconds: number
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
  answeredCalls: number
  totalDurationMinutes: number
  answerRate: number
}

export interface VoipDispositionBreakdown {
  answered: number
  no_answer: number
  busy: number
  voicemail: number
  failed: number
}

export interface VoipAnalytics {
  campaignId: string
  campaignName: string
  summary: VoipSummary
  hourlyVolume: VoipHourlyVolume[]
  topAgents: VoipTopAgent[]
  dispositionBreakdown: VoipDispositionBreakdown
}
