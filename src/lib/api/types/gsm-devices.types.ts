import { PaginationParams } from '../types';

export enum GsmDeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
}

export enum GsmPortStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  DISABLED = 'disabled',
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
  deviceId: string;
  portNumber: number;
  msisdn: string;
  imei: string | null;
  imsi: string | null;
  operator: string | null;
  balance: number | null;
  lastCallAt: string | null;
  lastCallDurationSeconds: number | null;
  status: GsmPortStatus;
  asteriskChannel: string | null;
  temperatureCelsius: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGsmDevicePortRequest {
  deviceId: string;
  portNumber: number;
  msisdn: string;
  status?: GsmPortStatus;
}

export interface UpdateGsmDevicePortRequest extends Partial<CreateGsmDevicePortRequest> {}

export interface GsmDevicePortsQueryParams extends PaginationParams {
  gsmDeviceId?: string;
  status?: GsmPortStatus;
}
