import { useTranslation } from 'react-i18next'
import { useSmsAnalytics } from '@/hooks/api/useSms'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useMe } from '@/hooks/api/useAuth'
import { ServiceType } from '@/lib/api/types/services.types'
import { useDateRange } from './DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { MessageSquare, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  sent: '#10B981',
  delivered: '#059669',
  failed: '#EF4444',
  pending: '#F59E0B',
  scheduled: '#8B5CF6',
  cancelled: '#6B7280',
  expired: '#DC2626',
}

const MASKING_COLORS = [
  '#FF6A00',
  '#0B1F3B',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
]

const OPERATOR_COLORS = [
  '#0B1F3B',
  '#FF6A00',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
]

export function SmsAnalyticsDashboard(): React.ReactElement | null {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const clientId = me?.clientId
  const { dateRange } = useDateRange()

  // Check if SMS service is enabled
  const { data: enabledServices, isLoading: isLoadingServices } =
    useEnabledServices(clientId)
  const isSmsEnabled = enabledServices?.some(
    (s) => s.serviceType === ServiceType.SMS,
  )

  // Fetch SMS analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useSmsAnalytics(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    isSmsEnabled === true,
  )

  // Don't render if services are loading or SMS is not enabled
  if (isLoadingServices) {
    return null
  }

  if (!isSmsEnabled) {
    return null
  }

  const summary = analytics?.summary

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards - Total Message, Total Sent, Total Failed, Success Rate */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalMessages', 'Total Messages')}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.totalMessages?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalSent', 'Total Sent')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {summary?.totalSent?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalFailed', 'Total Failed')}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {summary?.totalFailed?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.successRate', 'Success Rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.successRate?.toFixed(1) ?? 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: By Status, By Masking & By Operator - All Pie Charts in one row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* By Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.byStatus', 'By Status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoadingAnalytics ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics?.byStatus || []).map((s) => ({
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
                      {(analytics?.byStatus || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[entry.status.toLowerCase()] ||
                            MASKING_COLORS[index % MASKING_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
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

        {/* By Masking - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.byMasking', 'By Masking')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoadingAnalytics ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics?.byMasking || []).map((m) => ({
                        name: m.maskingName,
                        value: m.count,
                        percentage: m.percentage,
                      }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {(analytics?.byMasking || []).map((_, index) => (
                        <Cell
                          key={`masking-cell-${index}`}
                          fill={MASKING_COLORS[index % MASKING_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
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

        {/* By Operator - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.byOperator', 'By Operator')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoadingAnalytics ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics?.byOperator || []).map((o) => ({
                        name: o.operatorName,
                        value: o.count,
                        percentage: o.percentage,
                      }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {(analytics?.byOperator || []).map((_, index) => (
                        <Cell
                          key={`operator-cell-${index}`}
                          fill={OPERATOR_COLORS[index % OPERATOR_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
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
    </div>
  )
}
