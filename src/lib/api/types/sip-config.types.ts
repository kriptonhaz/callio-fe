export interface SipConfigResponse {
  lineNumber: number
  authId: string
  authPassword: string
  gwPrefix: string
  proxy: string
  registrar: string
  registerExpired: number
  phoneNumber: string
  displayName: string
  outboundProxy: string
  homeDomain: string
}

export interface SipConfigFormData {
  authId: string
  authPassword: string
  gwPrefix: string
  proxy: string
  registrar: string
  registerExpired: number
  phoneNumber: string
  displayName: string
  outboundProxy: string
  homeDomain: string
}

export interface UpdateSipConfigRequest {
  deviceId: string
  lineNumber: number
  authId: string
  authPassword: string
  gwPrefix: string
  proxy: string
  registrar: string
  registerExpired: number
  displayName: string
  phoneNumber: string
  outboundProxy: string
  homeDomain: string
}
