export const LEAD_STATUS_COLORS = [
  'blue',
  'yellow',
  'red',
  'orange',
  'gray',
  'green',
  'purple',
  'pink',
  'teal',
  'slate',
] as const

export type LeadStatusColor = (typeof LEAD_STATUS_COLORS)[number]

export interface LeadStatusOption {
  id: string
  clientId: string
  slug: string
  label: string
  color: LeadStatusColor
  order: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateLeadStatusOptionRequest {
  slug?: string
  label: string
  color: LeadStatusColor
  order?: number
}

export interface UpdateLeadStatusOptionRequest {
  label?: string
  color?: LeadStatusColor
  order?: number
  isActive?: boolean
}
