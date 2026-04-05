// Shared API Types

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Error Handling
export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
}

// Status Enums
export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserStatus {
  PENDING = 'pending_verification',
  DISABLED = 'disabled',
  SUSPENDED = 'suspended',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  AGENT = 'agent',
  SALES = 'sales',
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum LeadStatus {
  NEW = 'new',
  ATTEMPTED = 'attempted',
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  CLOSED = 'closed',
  MISSED = 'missed',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CallDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}

export enum CallStatus {
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  FAILED = 'failed',
  BUSY = 'busy',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}
