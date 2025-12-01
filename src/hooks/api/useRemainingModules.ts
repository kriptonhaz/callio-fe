import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  LeadAssignment, CreateLeadAssignmentRequest, UpdateLeadAssignmentRequest, LeadAssignmentsQueryParams,
  Recording, CreateRecordingRequest, UpdateRecordingRequest, RecordingsQueryParams,
  CallLog, CreateCallLogRequest, UpdateCallLogRequest, CallLogsQueryParams,
  SystemLog, CreateSystemLogRequest, SystemLogsQueryParams,

  PaymentHistory, CreatePaymentHistoryRequest, UpdatePaymentHistoryRequest, PaymentHistoryQueryParams,
  CoachingNote, CreateCoachingNoteRequest, UpdateCoachingNoteRequest, CoachingNotesQueryParams,
  LeadHistory, CreateLeadHistoryRequest, LeadHistoryQueryParams,
} from '@/lib/api/types/remaining-modules.types';
import {
  GsmDevicePort, CreateGsmDevicePortRequest, UpdateGsmDevicePortRequest, GsmDevicePortsQueryParams,
} from '@/lib/api/types/gsm-devices.types';

// ========== LEAD ASSIGNMENTS ==========

export const leadAssignmentsKeys = {
  all: ['lead-assignments'] as const,
  lists: () => [...leadAssignmentsKeys.all, 'list'] as const,
  list: (params: LeadAssignmentsQueryParams) => [...leadAssignmentsKeys.lists(), params] as const,
  details: () => [...leadAssignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadAssignmentsKeys.details(), id] as const,
};

const leadAssignmentsApi = {
  getAll: async (params: LeadAssignmentsQueryParams): Promise<PaginatedResponse<LeadAssignment>> => {
    const queryString = buildQueryString(params);
    return await apiClient.get(`lead-assignments${queryString}`).json<PaginatedResponse<LeadAssignment>>();
  },
  getById: async (id: string): Promise<LeadAssignment> => await apiClient.get(`lead-assignments/${id}`).json<LeadAssignment>(),
  create: async (data: CreateLeadAssignmentRequest): Promise<LeadAssignment> => await apiClient.post('lead-assignments', { json: data }).json<LeadAssignment>(),
  update: async (id: string, data: UpdateLeadAssignmentRequest): Promise<LeadAssignment> => await apiClient.patch(`lead-assignments/${id}`, { json: data }).json<LeadAssignment>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`lead-assignments/${id}`); },
};

export const useLeadAssignments = (params: LeadAssignmentsQueryParams = {}) => useQuery({ queryKey: leadAssignmentsKeys.list(params), queryFn: () => leadAssignmentsApi.getAll(params), staleTime: 30 * 1000 });
export const useLeadAssignment = (id: string) => useQuery({ queryKey: leadAssignmentsKeys.detail(id), queryFn: () => leadAssignmentsApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateLeadAssignment = () => { const qc = useQueryClient(); return useMutation({ mutationFn: leadAssignmentsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() }) }); };
export const useUpdateLeadAssignment = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateLeadAssignmentRequest }) => leadAssignmentsApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() }); qc.setQueryData(leadAssignmentsKeys.detail(variables.id), data); } }); };
export const useDeleteLeadAssignment = () => { const qc = useQueryClient(); return useMutation({ mutationFn: leadAssignmentsApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: leadAssignmentsKeys.lists() }); qc.removeQueries({ queryKey: leadAssignmentsKeys.detail(id) }); } }); };

// ========== RECORDINGS ==========

export const recordingsKeys = {
  all: ['recordings'] as const,
  lists: () => [...recordingsKeys.all, 'list'] as const,
  list: (params: RecordingsQueryParams) => [...recordingsKeys.lists(), params] as const,
  details: () => [...recordingsKeys.all, 'detail'] as const,
  detail: (id: string) => [...recordingsKeys.details(), id] as const,
};

const recordingsApi = {
  getAll: async (params: RecordingsQueryParams): Promise<PaginatedResponse<Recording>> => { const queryString = buildQueryString(params); return await apiClient.get(`recordings${queryString}`).json<PaginatedResponse<Recording>>(); },
  getById: async (id: string): Promise<Recording> => await apiClient.get(`recordings/${id}`).json<Recording>(),
  create: async (data: CreateRecordingRequest): Promise<Recording> => await apiClient.post('recordings', { json: data }).json<Recording>(),
  update: async (id: string, data: UpdateRecordingRequest): Promise<Recording> => await apiClient.patch(`recordings/${id}`, { json: data }).json<Recording>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`recordings/${id}`); },
};

export const useRecordings = (params: RecordingsQueryParams = {}) => useQuery({ queryKey: recordingsKeys.list(params), queryFn: () => recordingsApi.getAll(params), staleTime: 30 * 1000 });
export const useRecording = (id: string) => useQuery({ queryKey: recordingsKeys.detail(id), queryFn: () => recordingsApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateRecording = () => { const qc = useQueryClient(); return useMutation({ mutationFn: recordingsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: recordingsKeys.lists() }) }); };
export const useUpdateRecording = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateRecordingRequest }) => recordingsApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: recordingsKeys.lists() }); qc.setQueryData(recordingsKeys.detail(variables.id), data); } }); };
export const useDeleteRecording = () => { const qc = useQueryClient(); return useMutation({ mutationFn: recordingsApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: recordingsKeys.lists() }); qc.removeQueries({ queryKey: recordingsKeys.detail(id) }); } }); };

// ========== CALL LOGS ==========

export const callLogsKeys = {
  all: ['call-logs'] as const,
  lists: () => [...callLogsKeys.all, 'list'] as const,
  list: (params: CallLogsQueryParams) => [...callLogsKeys.lists(), params] as const,
  details: () => [...callLogsKeys.all, 'detail'] as const,
  detail: (id: string) => [...callLogsKeys.details(), id] as const,
};

const callLogsApi = {
  getAll: async (params: CallLogsQueryParams): Promise<PaginatedResponse<CallLog>> => { const queryString = buildQueryString(params); return await apiClient.get(`call-logs${queryString}`).json<PaginatedResponse<CallLog>>(); },
  getById: async (id: string): Promise<CallLog> => await apiClient.get(`call-logs/${id}`).json<CallLog>(),
  create: async (data: CreateCallLogRequest): Promise<CallLog> => await apiClient.post('call-logs', { json: data }).json<CallLog>(),
  update: async (id: string, data: UpdateCallLogRequest): Promise<CallLog> => await apiClient.patch(`call-logs/${id}`, { json: data }).json<CallLog>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`call-logs/${id}`); },
};

export const useCallLogs = (params: CallLogsQueryParams = {}) => useQuery({ queryKey: callLogsKeys.list(params), queryFn: () => callLogsApi.getAll(params), staleTime: 30 * 1000 });
export const useCallLog = (id: string) => useQuery({ queryKey: callLogsKeys.detail(id), queryFn: () => callLogsApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateCallLog = () => { const qc = useQueryClient(); return useMutation({ mutationFn: callLogsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: callLogsKeys.lists() }) }); };
export const useUpdateCallLog = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateCallLogRequest }) => callLogsApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: callLogsKeys.lists() }); qc.setQueryData(callLogsKeys.detail(variables.id), data); } }); };
export const useDeleteCallLog = () => { const qc = useQueryClient(); return useMutation({ mutationFn: callLogsApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: callLogsKeys.lists() }); qc.removeQueries({ queryKey: callLogsKeys.detail(id) }); } }); };

// ========== SYSTEM LOGS ==========

export const systemLogsKeys = {
  all: ['system-logs'] as const,
  lists: () => [...systemLogsKeys.all, 'list'] as const,
  list: (params: SystemLogsQueryParams) => [...systemLogsKeys.lists(), params] as const,
  details: () => [...systemLogsKeys.all, 'detail'] as const,
  detail: (id: string) => [...systemLogsKeys.details(), id] as const,
};

const systemLogsApi = {
  getAll: async (params: SystemLogsQueryParams): Promise<PaginatedResponse<SystemLog>> => { const queryString = buildQueryString(params); return await apiClient.get(`system-logs${queryString}`).json<PaginatedResponse<SystemLog>>(); },
  getById: async (id: string): Promise<SystemLog> => await apiClient.get(`system-logs/${id}`).json<SystemLog>(),
  create: async (data: CreateSystemLogRequest): Promise<SystemLog> => await apiClient.post('system-logs', { json: data }).json<SystemLog>(),
};

export const useSystemLogs = (params: SystemLogsQueryParams = {}) => useQuery({ queryKey: systemLogsKeys.list(params), queryFn: () => systemLogsApi.getAll(params), staleTime: 30 * 1000 });
export const useSystemLog = (id: string) => useQuery({ queryKey: systemLogsKeys.detail(id), queryFn: () => systemLogsApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateSystemLog = () => { const qc = useQueryClient(); return useMutation({ mutationFn: systemLogsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: systemLogsKeys.lists() }) }); };


// ========== GSM DEVICE PORTS ==========

export const gsmDevicePortsKeys = {
  all: ['gsm-device-ports'] as const,
  lists: () => [...gsmDevicePortsKeys.all, 'list'] as const,
  list: (params: GsmDevicePortsQueryParams) => [...gsmDevicePortsKeys.lists(), params] as const,
  details: () => [...gsmDevicePortsKeys.all, 'detail'] as const,
  detail: (id: string) => [...gsmDevicePortsKeys.details(), id] as const,
};

const gsmDevicePortsApi = {
  getAll: async (params: GsmDevicePortsQueryParams): Promise<PaginatedResponse<GsmDevicePort>> => { const queryString = buildQueryString(params); return await apiClient.get(`gsm-device-ports${queryString}`).json<PaginatedResponse<GsmDevicePort>>(); },
  getById: async (id: string): Promise<GsmDevicePort> => await apiClient.get(`gsm-device-ports/${id}`).json<GsmDevicePort>(),
  create: async (data: CreateGsmDevicePortRequest): Promise<GsmDevicePort> => await apiClient.post('gsm-device-ports', { json: data }).json<GsmDevicePort>(),
  update: async (id: string, data: UpdateGsmDevicePortRequest): Promise<GsmDevicePort> => await apiClient.patch(`gsm-device-ports/${id}`, { json: data }).json<GsmDevicePort>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`gsm-device-ports/${id}`); },
};

export const useGsmDevicePorts = (params: GsmDevicePortsQueryParams = {}) => useQuery({ queryKey: gsmDevicePortsKeys.list(params), queryFn: () => gsmDevicePortsApi.getAll(params), staleTime: 30 * 1000 });
export const useGsmDevicePort = (id: string) => useQuery({ queryKey: gsmDevicePortsKeys.detail(id), queryFn: () => gsmDevicePortsApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateGsmDevicePort = () => { const qc = useQueryClient(); return useMutation({ mutationFn: gsmDevicePortsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: gsmDevicePortsKeys.lists() }) }); };
export const useUpdateGsmDevicePort = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateGsmDevicePortRequest }) => gsmDevicePortsApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: gsmDevicePortsKeys.lists() }); qc.setQueryData(gsmDevicePortsKeys.detail(variables.id), data); } }); };
export const useDeleteGsmDevicePort = () => { const qc = useQueryClient(); return useMutation({ mutationFn: gsmDevicePortsApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: gsmDevicePortsKeys.lists() }); qc.removeQueries({ queryKey: gsmDevicePortsKeys.detail(id) }); } }); };

// ========== PAYMENT HISTORY ==========

export const paymentHistoryKeys = {
  all: ['payment-history'] as const,
  lists: () => [...paymentHistoryKeys.all, 'list'] as const,
  list: (params: PaymentHistoryQueryParams) => [...paymentHistoryKeys.lists(), params] as const,
  details: () => [...paymentHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentHistoryKeys.details(), id] as const,
};

const paymentHistoryApi = {
  getAll: async (params: PaymentHistoryQueryParams): Promise<PaginatedResponse<PaymentHistory>> => { const queryString = buildQueryString(params); return await apiClient.get(`payment-history${queryString}`).json<PaginatedResponse<PaymentHistory>>(); },
  getById: async (id: string): Promise<PaymentHistory> => await apiClient.get(`payment-history/${id}`).json<PaymentHistory>(),
  create: async (data: CreatePaymentHistoryRequest): Promise<PaymentHistory> => await apiClient.post('payment-history', { json: data }).json<PaymentHistory>(),
  update: async (id: string, data: UpdatePaymentHistoryRequest): Promise<PaymentHistory> => await apiClient.patch(`payment-history/${id}`, { json: data }).json<PaymentHistory>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`payment-history/${id}`); },
};

export const usePaymentHistory = (params: PaymentHistoryQueryParams = {}) => useQuery({ queryKey: paymentHistoryKeys.list(params), queryFn: () => paymentHistoryApi.getAll(params), staleTime: 30 * 1000 });
export const usePaymentHistoryItem = (id: string) => useQuery({ queryKey: paymentHistoryKeys.detail(id), queryFn: () => paymentHistoryApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreatePaymentHistory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: paymentHistoryApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: paymentHistoryKeys.lists() }) }); };
export const useUpdatePaymentHistory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdatePaymentHistoryRequest }) => paymentHistoryApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: paymentHistoryKeys.lists() }); qc.setQueryData(paymentHistoryKeys.detail(variables.id), data); } }); };
export const useDeletePaymentHistory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: paymentHistoryApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: paymentHistoryKeys.lists() }); qc.removeQueries({ queryKey: paymentHistoryKeys.detail(id) }); } }); };

// ========== COACHING NOTES ==========

export const coachingNotesKeys = {
  all: ['coaching-notes'] as const,
  lists: () => [...coachingNotesKeys.all, 'list'] as const,
  list: (params: CoachingNotesQueryParams) => [...coachingNotesKeys.lists(), params] as const,
  details: () => [...coachingNotesKeys.all, 'detail'] as const,
  detail: (id: string) => [...coachingNotesKeys.details(), id] as const,
};

const coachingNotesApi = {
  getAll: async (params: CoachingNotesQueryParams): Promise<PaginatedResponse<CoachingNote>> => { const queryString = buildQueryString(params); return await apiClient.get(`supervisor-coaching-notes${queryString}`).json<PaginatedResponse<CoachingNote>>(); },
  getById: async (id: string): Promise<CoachingNote> => await apiClient.get(`supervisor-coaching-notes/${id}`).json<CoachingNote>(),
  create: async (data: CreateCoachingNoteRequest): Promise<CoachingNote> => await apiClient.post('supervisor-coaching-notes', { json: data }).json<CoachingNote>(),
  update: async (id: string, data: UpdateCoachingNoteRequest): Promise<CoachingNote> => await apiClient.patch(`supervisor-coaching-notes/${id}`, { json: data }).json<CoachingNote>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`supervisor-coaching-notes/${id}`); },
};

export const useCoachingNotes = (params: CoachingNotesQueryParams = {}) => useQuery({ queryKey: coachingNotesKeys.list(params), queryFn: () => coachingNotesApi.getAll(params), staleTime: 30 * 1000 });
export const useCoachingNote = (id: string) => useQuery({ queryKey: coachingNotesKeys.detail(id), queryFn: () => coachingNotesApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateCoachingNote = () => { const qc = useQueryClient(); return useMutation({ mutationFn: coachingNotesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: coachingNotesKeys.lists() }) }); };
export const useUpdateCoachingNote = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateCoachingNoteRequest }) => coachingNotesApi.update(id, data), onSuccess: (data, variables) => { qc.invalidateQueries({ queryKey: coachingNotesKeys.lists() }); qc.setQueryData(coachingNotesKeys.detail(variables.id), data); } }); };
export const useDeleteCoachingNote = () => { const qc = useQueryClient(); return useMutation({ mutationFn: coachingNotesApi.delete, onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: coachingNotesKeys.lists() }); qc.removeQueries({ queryKey: coachingNotesKeys.detail(id) }); } }); };

// ========== LEAD HISTORY ==========

export const leadHistoryKeys = {
  all: ['lead-history'] as const,
  lists: () => [...leadHistoryKeys.all, 'list'] as const,
  list: (params: LeadHistoryQueryParams) => [...leadHistoryKeys.lists(), params] as const,
  details: () => [...leadHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadHistoryKeys.details(), id] as const,
};

const leadHistoryApi = {
  getAll: async (params: LeadHistoryQueryParams): Promise<PaginatedResponse<LeadHistory>> => { const queryString = buildQueryString(params); return await apiClient.get(`lead-history${queryString}`).json<PaginatedResponse<LeadHistory>>(); },
  getById: async (id: string): Promise<LeadHistory> => await apiClient.get(`lead-history/${id}`).json<LeadHistory>(),
  create: async (data: CreateLeadHistoryRequest): Promise<LeadHistory> => await apiClient.post('lead-history', { json: data }).json<LeadHistory>(),
};

export const useLeadHistory = (params: LeadHistoryQueryParams = {}) => useQuery({ queryKey: leadHistoryKeys.list(params), queryFn: () => leadHistoryApi.getAll(params), staleTime: 30 * 1000 });
export const useLeadHistoryItem = (id: string) => useQuery({ queryKey: leadHistoryKeys.detail(id), queryFn: () => leadHistoryApi.getById(id), enabled: !!id, staleTime: 30 * 1000 });
export const useCreateLeadHistory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: leadHistoryApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: leadHistoryKeys.lists() }) }); };
