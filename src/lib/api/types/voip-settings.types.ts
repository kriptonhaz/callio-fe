import type { LastCallStatus } from './lead-assignments.types'

export interface VoipSettings {
  autoAdvanceEnabled: boolean
  autoAdvanceDelaySec: number
  autoAdvanceLiveCall: boolean
  autoAdvanceStatuses: LastCallStatus[]
}

export type UpsertVoipSettingsRequest = VoipSettings
