import type { UserRole, UserStatus, PaginationParams } from '../types'

// User entity (same as auth User but for consistency)
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  clientId?: string
  supervisorId?: string
  phone?: string
  sipExtension?: string | null
  createdAt: string
  updatedAt?: string
}

// Request types
export interface CreateUserRequest {
  email: string
  passwordHash: string
  name: string
  role: UserRole
  clientId?: string
  supervisorId?: string
  phone?: string
  status?: UserStatus
}

export interface UpdateUserRequest
  extends Partial<Omit<CreateUserRequest, 'password'>> {
  password?: string
}

// Query parameters
export interface UsersQueryParams extends PaginationParams {
  search?: string
  role?: UserRole
  status?: UserStatus
  clientId?: string
  supervisorId?: string
  nullClientId?: boolean
}
