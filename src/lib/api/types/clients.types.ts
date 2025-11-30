export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Client entity
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: ClientStatus;
  subscriptionPlan?: string; // Plan name (e.g., Basic, Pro, Enterprise)
  subscriptionExpiry?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
}

// Query parameters
export interface ClientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
}
