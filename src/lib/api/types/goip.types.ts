export interface GoipLineStatus {
  id: number;
  module_status_gsm: string;
  module_title_gsm: string;
  module_status: string;
  module_title: string;
  gsm_sim: string;
  gsm_status: string;
  status_line: string;
  line_state: string;
  sms_login: string;
  smb_login: string;
  gsm_signal: string;
  gsm_cur_oper: string;
  gsm_cur_bst: string;
  volte: string;
  lac: string;
  sim_remain: string;
  nocall_t: string;
  acd: string;
  asr: string;
  callt: string;
  callc: string;
  rct: string;
  sms_count: string;
  call_count: string;
}

export interface GoipStatusResponse {
  lines: GoipLineStatus[];
  raw: Record<string, string>;
}
