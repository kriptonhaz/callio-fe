import type { ClientStatus, SubscriptionPlan, PaginationParams } from '../types';

// Client entity
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: ClientStatus;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  maxConcurrentCalls?: number;
  createdAt: string;
  updatedAt?: string;
}

// Request types
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  maxConcurrentCalls?: number;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

// Query parameters
export interface ClientsQueryParams extends PaginationParams {
  search?: string;
  status?: ClientStatus;
}
