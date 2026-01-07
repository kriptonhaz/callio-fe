import { useTranslation } from 'react-i18next'
import { useCallLogsAnalytics } from '@/hooks/api/useRemainingModules'
import { useDateRange } from './DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Phone, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

export function VoipAnalyticsDashboard(): React.ReactElement {
  const { t } = useTranslation()
  const { dateRange } = useDateRange()

  // Fetch VoIP analytics
  const { data: analytics, isLoading } = useCallLogsAnalytics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const summary = analytics?.summary

  // Format hourly data for the chart
  const hourlyData = (analytics?.hourlyVolumeToday || []).map((h) => ({
    hour: `${h.hour.toString().padStart(2, '0')}:00`,
    total: h.total,
    answered: h.answered,
    unanswered: h.unanswered,
  }))

  // Format duration to human readable
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards - 5 cards in a single row on large screens */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {/* Total Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalCalls', 'Total Calls')}
            </CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.totalCalls?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Duration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalDuration', 'Total Duration')}
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatDuration(summary?.totalDurationMinutes ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answered Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.answeredCalls', 'Answered Calls')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {summary?.answeredCalls?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unanswered Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.unansweredCalls', 'Unanswered Calls')}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {summary?.unansweredCalls?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.answerRate', 'Answer Rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.answerRate?.toFixed(1) ?? 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Call Volume & Top Agents */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Hourly Call Volume - Line Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>
              {t('dashboard.callVolumeToday', 'Call Volume Today')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="hour"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="answered"
                      name={t('dashboard.answered', 'Answered')}
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unanswered"
                      name={t('dashboard.unanswered', 'Unanswered')}
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Agents - Bar Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.topAgents', 'Top Agents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.topAgents || []} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="agentName"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'totalCalls') {
                          return [
                            value.toLocaleString(),
                            t('dashboard.calls', 'Calls'),
                          ]
                        }
                        return [value.toLocaleString(), name]
                      }}
                    />
                    <Bar
                      dataKey="totalCalls"
                      name={t('dashboard.calls', 'Calls')}
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
