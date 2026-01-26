export interface CpuInfo {
  manufacturer: string
  brand: string
  speed: number
  cores: number
  physicalCores: number
  currentLoad: number
  loadAvg: number[]
}

export interface MemoryInfo {
  total: number
  free: number
  used: number
  active: number
  available: number
  swaptotal: number
  swapused: number
  swapfree: number
}

export interface DiskInfo {
  fs: string
  type: string
  size: number
  used: number
  available: number
  use: number
  mount: string
}

export interface DiskIO {
  rx: number
  wx: number
  tx: number
  rx_sec: number | null
  wx_sec: number | null
}

export interface NetworkInterface {
  iface: string
  ip4: string
  rx_bytes: number
  rx_dropped: number
  rx_errors: number
  tx_bytes: number
  tx_dropped: number
  tx_errors: number
  rx_sec: number | null
  tx_sec: number | null
}

export interface ConnectionInfo {
  protocol: string
  localAddress: string
  localPort: string
  peerAddress: string
  peerPort: string
  state: string
}

export interface Pm2Info {
  name: string
  pid: number
  pm_id: number
  status: string
  restart_time: number
  uptime: number
  memory: number
  cpu: number
  instances?: number
  unstable_restarts: number
}

export interface SystemInfoResponse {
  cpu: CpuInfo
  memory: MemoryInfo
  disk: {
    disks: DiskInfo[]
    io: DiskIO
  }
  network: NetworkInterface[]
  connections: {
    summary: ConnectionInfo[]
    count: number
    active: number
  }
  pm2: Pm2Info[]
}
