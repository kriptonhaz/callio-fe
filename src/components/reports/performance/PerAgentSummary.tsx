import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PerAgentBreakdownItem } from '@/lib/api/types/lead-assignment-analytics.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LeadStatusBadge } from '@/components/lead-status/LeadStatusBadge'

interface Props {
  data: Array<PerAgentBreakdownItem> | undefined
}

export function PerAgentSummary({ data }: Props) {
  const rows = data ?? []

  const chartData = useMemo(
    () =>
      rows.slice(0, 10).map((r) => ({
        name: r.agentName,
        total: r.totalLeads,
        converted: r.conversionCount,
      })),
    [rows],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-agent performance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No agents with activity in this date range.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="total" fill="#3B82F6" name="Leads worked" />
                <Bar
                  dataKey="converted"
                  fill="#10B981"
                  name="Conversions"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Leads worked</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Conv. rate</TableHead>
                    <TableHead>Status breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const rate =
                      r.totalLeads > 0
                        ? Math.round(
                            (r.conversionCount / r.totalLeads) * 1000,
                          ) / 10
                        : 0
                    const topStatuses = Object.entries(r.statusCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                    return (
                      <TableRow key={r.agentId}>
                        <TableCell className="font-medium">
                          {r.agentName}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.totalLeads.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.conversionCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {rate}%
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {topStatuses.map(([slug, count]) => (
                              <span
                                key={slug}
                                className="inline-flex items-center gap-1"
                              >
                                <LeadStatusBadge slug={slug} />
                                <span className="text-xs text-muted-foreground">
                                  ×{count}
                                </span>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
