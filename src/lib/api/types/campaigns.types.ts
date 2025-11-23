import type { CampaignStatus, PaginationParams } from '../types';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  clientId: string;
  createdBy: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  status?: CampaignStatus;
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}

export interface CampaignsQueryParams extends PaginationParams {
  search?: string;
  status?: CampaignStatus;
  clientId?: string;
  createdBy?: string;
}
