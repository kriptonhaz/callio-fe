import type { AppointmentStatus, PaginationParams } from '../types';

export interface Appointment {
  id: string;
  leadId: string;
  agentId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentRequest {
  leadId: string;
  agentId: string;
  scheduledAt: string;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {}

export interface AppointmentsQueryParams extends PaginationParams {
  status?: AppointmentStatus;
  leadId?: string;
  agentId?: string;
}
