import type { UserRole, UserStatus } from '../types';

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  clientId?: string;
  supervisorId?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

// Authentication requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  clientId?: string;
  supervisorId?: string;
  phone?: string;
  status?: UserStatus;
}

// Authentication response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
