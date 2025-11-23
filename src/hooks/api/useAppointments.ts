import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentsQueryParams } from '@/lib/api/types/appointments.types';

export const appointmentsKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentsKeys.all, 'list'] as const,
  list: (params: AppointmentsQueryParams) => [...appointmentsKeys.lists(), params] as const,
  details: () => [...appointmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentsKeys.details(), id] as const,
};

const appointmentsApi = {
  getAll: async (params: AppointmentsQueryParams): Promise<PaginatedResponse<Appointment>> => {
    const queryString = buildQueryString(params);
    return await apiClient.get(`appointments${queryString}`).json<PaginatedResponse<Appointment>>();
  },

  getById: async (id: string): Promise<Appointment> => {
    return await apiClient.get(`appointments/${id}`).json<Appointment>();
  },

  create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    return await apiClient.post('appointments', { json: data }).json<Appointment>();
  },

  update: async (id: string, data: UpdateAppointmentRequest): Promise<Appointment> => {
    return await apiClient.patch(`appointments/${id}`, { json: data }).json<Appointment>();
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`appointments/${id}`);
  },
};

export const useAppointments = (params: AppointmentsQueryParams = {}): UseQueryResult<PaginatedResponse<Appointment>, Error> => {
  return useQuery({
    queryKey: appointmentsKeys.list(params),
    queryFn: () => appointmentsApi.getAll(params),
    staleTime: 30 * 1000,
  });
};

export const useAppointment = (id: string): UseQueryResult<Appointment, Error> => {
  return useQuery({
    queryKey: appointmentsKeys.detail(id),
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

export const useCreateAppointment = (): UseMutationResult<Appointment, Error, CreateAppointmentRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
    },
  });
};

export const useUpdateAppointment = (): UseMutationResult<Appointment, Error, { id: string; data: UpdateAppointmentRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
      queryClient.setQueryData(appointmentsKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteAppointment = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
      queryClient.removeQueries({ queryKey: appointmentsKeys.detail(id) });
    },
  });
};
