import { PaginationParams } from '../types';

export enum GsmDeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
}

export enum GsmPortStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

// GSM Devices
export interface GsmDevice {
  id: string;
  clientId: string;
  name: string;
  remoteUrl: string;
  username: string;
  password: string;
  totalPorts: number;
  model?: string;
  firmwareVersion?: string;
  imei: string;
  status: GsmDeviceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGsmDeviceRequest {
  name: string;
  remoteUrl: string;
  username: string;
  password: string;
  totalPorts: number;
  model?: string;
  firmwareVersion?: string;
  status?: GsmDeviceStatus;
  clientId?: string;
  imei?: string;
}

export interface UpdateGsmDeviceRequest extends Partial<CreateGsmDeviceRequest> {}

export interface GsmDevicesQueryParams extends PaginationParams {
  search?: string;
  clientId?: string;
  status?: GsmDeviceStatus;
}

// GSM Device Ports
export interface GsmDevicePort {
  id: string;
  gsmDeviceId: string;
  portNumber: number;
  phoneNumber: string;
  status: GsmPortStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGsmDevicePortRequest {
  gsmDeviceId: string;
  portNumber: number;
  phoneNumber: string;
  status?: GsmPortStatus;
}

export interface UpdateGsmDevicePortRequest extends Partial<CreateGsmDevicePortRequest> {}

export interface GsmDevicePortsQueryParams extends PaginationParams {
  gsmDeviceId?: string;
  status?: GsmPortStatus;
}
