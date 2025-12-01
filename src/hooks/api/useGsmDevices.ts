import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api/client';
import type { PaginatedResponse } from '@/lib/api/types';
import type {
  GsmDevice, CreateGsmDeviceRequest, UpdateGsmDeviceRequest, GsmDevicesQueryParams,
  CreateGsmDevicePortRequest, GsmDevicePort,
} from '@/lib/api/types/gsm-devices.types';
import type { GoipStatusResponse } from '@/lib/api/types/goip.types';

export const gsmDevicesKeys = {
  all: ['gsm-devices'] as const,
  lists: () => [...gsmDevicesKeys.all, 'list'] as const,
  list: (params: GsmDevicesQueryParams) => [...gsmDevicesKeys.lists(), params] as const,
  details: () => [...gsmDevicesKeys.all, 'detail'] as const,
  detail: (id: string) => [...gsmDevicesKeys.details(), id] as const,
};

const gsmDevicesApi = {
  getAll: async (params: GsmDevicesQueryParams): Promise<PaginatedResponse<GsmDevice>> => {
    const queryString = buildQueryString(params);
    return await apiClient.get(`gsm-devices${queryString}`).json<PaginatedResponse<GsmDevice>>();
  },
  getById: async (id: string): Promise<GsmDevice> => await apiClient.get(`gsm-devices/${id}`).json<GsmDevice>(),
  create: async (data: CreateGsmDeviceRequest): Promise<GsmDevice> => await apiClient.post('gsm-devices', { json: data }).json<GsmDevice>(),
  update: async (id: string, data: UpdateGsmDeviceRequest): Promise<GsmDevice> => await apiClient.patch(`gsm-devices/${id}`, { json: data }).json<GsmDevice>(),
  delete: async (id: string): Promise<void> => { await apiClient.delete(`gsm-devices/${id}`); },
};

export const useGsmDevices = (params: GsmDevicesQueryParams = {}) => useQuery({
  queryKey: gsmDevicesKeys.list(params),
  queryFn: () => gsmDevicesApi.getAll(params),
  staleTime: 30 * 1000,
});

export const useGsmDevice = (id: string) => useQuery({
  queryKey: gsmDevicesKeys.detail(id),
  queryFn: () => gsmDevicesApi.getById(id),
  enabled: !!id,
  staleTime: 30 * 1000,
});

export const useCreateGsmDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gsmDevicesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: gsmDevicesKeys.lists() }),
  });
};

export const useUpdateGsmDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGsmDeviceRequest }) => gsmDevicesApi.update(id, data),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: gsmDevicesKeys.lists() });
      qc.setQueryData(gsmDevicesKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteGsmDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gsmDevicesApi.delete,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: gsmDevicesKeys.lists() });
      qc.removeQueries({ queryKey: gsmDevicesKeys.detail(id) });
    },
  });
};

export const useGsmDevicePorts = (gsmDeviceId: string) => useQuery({
  queryKey: [...gsmDevicesKeys.detail(gsmDeviceId), 'ports'],
  queryFn: async () => await apiClient.get(`gsm-devices/${gsmDeviceId}/ports`).json<GsmDevicePort[]>(),
  enabled: !!gsmDeviceId,
});

export const useCreateGsmDevicePort = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGsmDevicePortRequest) => await apiClient.post('gsm-device-ports', { json: data }).json<GsmDevicePort>(),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: [...gsmDevicesKeys.detail(variables.deviceId), 'ports'] });
    },
  });
};

export const useGoipStatus = (deviceId: string) => useQuery({
  queryKey: ['goip-status', deviceId],
  queryFn: async () => await apiClient.get(`goip/status?deviceId=${deviceId}`).json<GoipStatusResponse>(),
  enabled: !!deviceId,
  refetchInterval: 5000, // Poll every 5 seconds
  staleTime: 0, // Always consider data stale to ensure fresh data
});

import { SendUssdRequest, DisconnectUssdRequest, UssdResultResponse } from '@/lib/api/types/ussd.types';

export const useSendUssd = () => {
  return useMutation({
    mutationFn: async (data: SendUssdRequest) => await apiClient.post('goip/ussd/send', { json: data }).json(),
  });
};

export const useDisconnectUssd = () => {
  return useMutation({
    mutationFn: async (data: DisconnectUssdRequest) => await apiClient.post('goip/ussd/disconnect', { json: data }).json(),
  });
};

export const useUssdResult = (deviceId: string, enabled: boolean) => useQuery({
  queryKey: ['ussd-result', deviceId],
  queryFn: async () => await apiClient.get(`goip/ussd/result?deviceId=${deviceId}`).json<UssdResultResponse>(),
  enabled: !!deviceId && enabled,
  refetchInterval: 2000, // Poll every 2 seconds
  staleTime: 0,
});
