import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OutcomeFunnelItem } from '@/lib/api/types/lead-assignment-analytics.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeadStatusOptions } from '@/hooks/api/useLeadStatusOptions'
import { humanizeSlug } from '@/lib/lead-status/constants'

const COLOR_HEX: Record<string, string> = {
  blue: '#3B82F6',
  yellow: '#EAB308',
  red: '#EF4444',
  orange: '#F97316',
  gray: '#6B7280',
  green: '#10B981',
  purple: '#A855F7',
  pink: '#EC4899',
  teal: '#14B8A6',
  slate: '#64748B',
}

interface Props {
  data: Array<OutcomeFunnelItem> | undefined
}

export function OutcomeFunnel({ data }: Props) {
  const { data: options } = useLeadStatusOptions()

  const rows = (data ?? []).map((d) => {
    const opt = options?.find((o) => o.slug === d.statusSlug)
    return {
      slug: d.statusSlug,
      label: opt?.label ?? humanizeSlug(d.statusSlug),
      leadCount: d.leadCount,
      avgAttempts: d.avgAttemptsToReach,
      color: COLOR_HEX[opt?.color ?? 'slate'] ?? '#64748B',
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Outcome funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No outcomes in this date range.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(v: number, name: string) => [
                    v,
                    name === 'leadCount' ? 'Leads' : name,
                  ]}
                />
                <Bar dataKey="leadCount" name="Leads">
                  {rows.map((r) => (
                    <Cell key={r.slug} fill={r.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground mb-1">
                Avg attempts to reach each outcome
              </div>
              {rows.map((r) => (
                <div
                  key={r.slug}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: r.color }}
                      aria-hidden
                    />
                    <span>{r.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-xs">
                      {r.leadCount} leads
                    </span>
                    <span className="font-medium tabular-nums">
                      {r.avgAttempts.toFixed(1)} avg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
