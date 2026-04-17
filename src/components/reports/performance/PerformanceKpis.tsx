import { PhoneCall, Target, TrendingUp, Users } from 'lucide-react'
import type { LeadAssignmentAnalyticsResponse } from '@/lib/api/types/lead-assignment-analytics.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  analytics: LeadAssignmentAnalyticsResponse | undefined
}

export function PerformanceKpis({ analytics }: Props) {
  const totalLeads = analytics?.processingRate.total ?? 0
  const processed = analytics?.processingRate.processed ?? 0
  const conversionRate =
    totalLeads > 0 ? Math.round((processed / totalLeads) * 1000) / 10 : 0
  const avgAttempts = analytics?.followupStats.averageFollowups ?? 0
  const totalAttempts = analytics?.followupStats.totalFollowups ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        icon={<Users className="h-4 w-4" />}
        label="Leads worked"
        value={totalLeads.toLocaleString()}
      />
      <KpiCard
        icon={<Target className="h-4 w-4" />}
        label="Conversion rate"
        value={`${conversionRate}%`}
        hint={`${processed.toLocaleString()} moved off "New"`}
      />
      <KpiCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Avg attempts / lead"
        value={avgAttempts.toFixed(1)}
      />
      <KpiCard
        icon={<PhoneCall className="h-4 w-4" />}
        label="Total attempts"
        value={totalAttempts.toLocaleString()}
      />
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}
