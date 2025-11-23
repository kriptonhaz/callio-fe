import type { LeadStatus, PaginationParams } from '../types';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  clientId: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone: string;
  status?: LeadStatus;
  clientId: string;
  source?: string;
  notes?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

export interface LeadsQueryParams extends PaginationParams {
  search?: string;
  status?: LeadStatus;
  clientId?: string;
}
