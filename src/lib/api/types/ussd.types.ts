export interface SendUssdRequest {
  deviceId: string;
  lineNumber: number;
  ussdCode: string;
}

export interface DisconnectUssdRequest {
  deviceId: string;
  lineNumber: number;
}

export interface UssdResultItem {
  line: number;
  smsKey: string;
  status: string;
  result: string;
}

export interface UssdResultResponse {
  results: UssdResultItem[];
}
