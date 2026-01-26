import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSystemInfo } from '@/hooks/api/useSystemInfo'
import {
  Activity,
  Cpu,
  Globe,
  HardDrive,
  LayoutGrid,
  MemoryStick,
  Network,
  Terminal,
} from 'lucide-react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatBytes, formatDuration } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function SuperAdminDashboard() {
  const { t } = useTranslation()
  const { data: sys, isLoading } = useSystemInfo()

  if (isLoading || !sys) {
    return <DashboardSkeleton />
  }

  // Memory Data for Pie Chart
  const memoryData = [
    { name: 'Used', value: sys.memory.used, color: '#f59e0b' }, // Amber
    { name: 'Free', value: sys.memory.free, color: '#10b981' }, // Emerald
    { name: 'Active', value: sys.memory.active, color: '#3b82f6' }, // Blue
  ]

  // Disk Data for Bar Chart
  const diskData = sys.disk.disks.map((d) => ({
    mount: d.mount,
    used: d.used,
    free: d.size - d.used,
    size: d.size,
  }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <LayoutGrid className="h-8 w-8" />
          {t('dashboard.systemOverview', 'System Overview')}
        </h2>
        <p className="text-muted-foreground">
          {t('dashboard.systemOverviewDesc', 'Real-time server monitoring.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* CPU Section - COL 4 */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              Processor (CPU)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {sys.cpu.currentLoad.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {sys.cpu.speed} GHz ({sys.cpu.cores} Cores)
                </span>
              </div>
              <Progress value={sys.cpu.currentLoad} className="h-2" />

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="flex flex-col bg-muted/40 p-2 rounded items-center">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    1m Avg
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {sys.cpu.loadAvg[0]?.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col bg-muted/40 p-2 rounded items-center">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    5m Avg
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {sys.cpu.loadAvg[1]?.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col bg-muted/40 p-2 rounded items-center">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    15m Avg
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {sys.cpu.loadAvg[2]?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2 break-words">
                {sys.cpu.manufacturer} {sys.cpu.brand}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Section - COL 4 */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-blue-500" />
              Memory (RAM)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={memoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatBytes(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  itemStyle={{
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-muted-foreground mt-1">
              Total: {formatBytes(sys.memory.total)} | Swap:{' '}
              {formatBytes(sys.memory.swapused)} /{' '}
              {formatBytes(sys.memory.swaptotal)}
            </div>
          </CardContent>
        </Card>

        {/* Disk Section - COL 4 */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diskData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="mount"
                  width={50}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => formatBytes(value)}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  itemStyle={{
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar
                  dataKey="used"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[4, 0, 0, 4]}
                />
                <Bar
                  dataKey="free"
                  stackId="a"
                  fill="#e2e8f0"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network Stats - COL 6 */}
        <Card className="col-span-1 lg:col-span-6 h-[300px] flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-500" />
              Network Interfaces
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0">
            <div className="space-y-4">
              {sys.network.map((net) => (
                <div
                  key={net.iface}
                  className="bg-muted/30 p-3 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Network className="h-3 w-3" />
                      {net.iface}
                      {net.ip4 && (
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-mono">
                          {net.ip4}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3">
                      <span>
                        Rx:{' '}
                        <span className="text-emerald-500">
                          {formatBytes(net.rx_sec || 0)}/s
                        </span>
                      </span>
                      <span>
                        Tx:{' '}
                        <span className="text-blue-500">
                          {formatBytes(net.tx_sec || 0)}/s
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    <div>Total Rx: {formatBytes(net.rx_bytes)}</div>
                    <div>Total Tx: {formatBytes(net.tx_bytes)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Connections Table - COL 6 */}
        <Card className="col-span-1 lg:col-span-6 h-[300px] flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                Active Connections
              </div>
              <span className="text-xs font-normal bg-muted px-2 py-1 rounded">
                Total: {sys.connections.count} | Active:{' '}
                {sys.connections.active}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 pt-0">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Proto</th>
                      <th className="text-left p-2 font-medium">Local</th>
                      <th className="text-left p-2 font-medium">Foreign</th>
                      <th className="text-left p-2 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sys.connections.summary.map((conn, i) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="p-2 uppercase text-muted-foreground">
                          {conn.protocol}
                        </td>
                        <td className="p-2">
                          {conn.localAddress}:{conn.localPort}
                        </td>
                        <td className="p-2">
                          {conn.peerAddress}:{conn.peerPort}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              conn.state === 'ESTABLISHED'
                                ? 'bg-green-500/10 text-green-500'
                                : conn.state === 'LISTEN'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-gray-500/10 text-gray-500'
                            }`}
                          >
                            {conn.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* PM2 Processes - COL 12 */}
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-500" />
              Process Manager (PM2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">CPU</th>
                    <th className="text-left p-3 font-medium">Memory</th>
                    <th className="text-left p-3 font-medium">Uptime</th>
                    <th className="text-left p-3 font-medium">Restarts</th>
                  </tr>
                </thead>
                <tbody>
                  {sys.pm2?.map((proc) => (
                    <tr
                      key={proc.pm_id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 font-semibold">{proc.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {proc.pm_id}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            proc.status === 'online'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {proc.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{proc.cpu}%</td>
                      <td className="p-3 font-mono">
                        {formatBytes(proc.memory)}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {formatDuration(proc.uptime / 1000)}
                      </td>
                      <td className="p-3 font-mono">{proc.restart_time}</td>
                    </tr>
                  ))}
                  {(!sys.pm2 || sys.pm2.length === 0) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No PM2 processes found or monitoring disabled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        <Skeleton className="col-span-4 h-[250px]" />
        <Skeleton className="col-span-4 h-[250px]" />
        <Skeleton className="col-span-4 h-[250px]" />
        <Skeleton className="col-span-6 h-[300px]" />
        <Skeleton className="col-span-6 h-[300px]" />
        <Skeleton className="col-span-12 h-[200px]" />
      </div>
    </div>
  )
}
