import { useTranslation } from 'react-i18next'
import { useLeadAssignmentAnalytics } from '@/hooks/api/useLeadAssignments'
import { useDateRange } from './DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ListTodo, TrendingUp, RotateCcw, Clock } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  attempted: '#F59E0B',
  hot: '#EF4444',
  warm: '#F97316',
  cold: '#06B6D4',
  closed: '#10B981',
  missed: '#6B7280',
}

const DISPOSITION_COLORS: Record<string, string> = {
  answered: '#10B981',
  no_answer: '#EF4444',
  busy: '#F59E0B',
  voicemail: '#8B5CF6',
  wrong_number: '#DC2626',
  callback_requested: '#06B6D4',
  not_interested: '#6B7280',
  interested: '#059669',
  disconnected: '#9CA3AF',
  invalid_number: '#BE185D',
  failed: '#7F1D1D',
  cancelled: '#4B5563',
}

const CAMPAIGN_COLORS = [
  '#FF6A00',
  '#0B1F3B',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
]

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    borderRadius: 'var(--radius)',
    color: 'hsl(var(--popover-foreground))',
  },
  itemStyle: {
    color: 'hsl(var(--popover-foreground))',
  },
  labelStyle: {
    color: 'hsl(var(--popover-foreground))',
  },
}

export function AgentDashboard(): React.ReactElement {
  const { t } = useTranslation()
  const { dateRange } = useDateRange()

  const { data: analytics, isLoading } = useLeadAssignmentAnalytics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const todayQueue = analytics?.todayQueue
  const processingRate = analytics?.processingRate
  const followupStats = analytics?.followupStats

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Today's Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.agent.todayQueue', "Today's Queue")}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {t('dashboard.agent.today', 'Today')}
              </Badge>
            </div>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {todayQueue?.total?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayQueue?.pending ?? 0}{' '}
                  {t('dashboard.agent.pending', 'pending')} /{' '}
                  {todayQueue?.processed ?? 0}{' '}
                  {t('dashboard.agent.done', 'done')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Processing Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.agent.processingRate', 'Processing Rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {processingRate?.rate?.toFixed(1) ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {processingRate?.processed ?? 0}/
                  {processingRate?.total ?? 0}{' '}
                  {t('dashboard.agent.leads', 'leads')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Follow-ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.agent.totalFollowups', 'Total Follow-ups')}
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {followupStats?.totalFollowups?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.agent.avg', 'Avg')}{' '}
                  {followupStats?.averageFollowups?.toFixed(1) ?? 0} /{' '}
                  {t('dashboard.agent.max', 'Max')}{' '}
                  {followupStats?.maxFollowups ?? 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.agent.pendingToday', 'Pending Today')}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {t('dashboard.agent.today', 'Today')}
              </Badge>
            </div>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {todayQueue?.pending?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Daily Activity + Lead Status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Daily Activity - Stacked Bar Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>
              {t('dashboard.agent.dailyActivity', 'Daily Activity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (analytics?.dailyBreakdown || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t('dashboard.agent.noData', 'No data for this period')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.dailyBreakdown || []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) => {
                        const d = new Date(value)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'processed'
                          ? t('dashboard.agent.processed', 'Processed')
                          : t('dashboard.agent.pendingLabel', 'Pending'),
                      ]}
                      labelFormatter={(label: string) => {
                        const d = new Date(label)
                        return d.toLocaleDateString()
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="processed"
                      name={t('dashboard.agent.processed', 'Processed')}
                      stackId="a"
                      fill="#10B981"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      name={t('dashboard.agent.pendingLabel', 'Pending')}
                      stackId="a"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Status - Donut Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {t('dashboard.agent.leadStatus', 'Lead Status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (analytics?.statusBreakdown || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t('dashboard.agent.noData', 'No data for this period')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics?.statusBreakdown || []).map((s) => ({
                        name: s.status,
                        value: s.count,
                        percentage: s.percentage,
                      }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {(analytics?.statusBreakdown || []).map(
                        (entry, index) => (
                          <Cell
                            key={`status-${index}`}
                            fill={
                              STATUS_COLORS[entry.status.toLowerCase()] ||
                              CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]
                            }
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Call Disposition + Campaign Breakdown */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Call Disposition - Donut Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.agent.callDisposition', 'Call Disposition')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (analytics?.callDispositionBreakdown || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t('dashboard.agent.noData', 'No data for this period')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics?.callDispositionBreakdown || []).map(
                        (d) => ({
                          name: d.disposition,
                          value: d.count,
                        }),
                      )}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {(analytics?.callDispositionBreakdown || []).map(
                        (entry, index) => (
                          <Cell
                            key={`disposition-${index}`}
                            fill={
                              DISPOSITION_COLORS[
                                entry.disposition.toLowerCase()
                              ] ||
                              CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]
                            }
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Breakdown - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.agent.campaignBreakdown', 'Campaign Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (analytics?.campaignBreakdown || []).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t('dashboard.agent.noData', 'No data for this period')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.campaignBreakdown || []}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="campaignName"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      {...tooltipStyle}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        t('dashboard.agent.leads', 'Leads'),
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      name={t('dashboard.agent.leads', 'Leads')}
                      fill="#FF6A00"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
