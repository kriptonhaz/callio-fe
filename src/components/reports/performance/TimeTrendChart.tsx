import { format, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyBreakdownItem } from '@/lib/api/types/lead-assignment-analytics.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  data: Array<DailyBreakdownItem> | undefined
}

export function TimeTrendChart({ data }: Props) {
  const chartData = (data ?? []).map((d) => ({
    date: d.date,
    label: safeFormat(d.date),
    total: d.total,
    processed: d.processed,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily activity trend</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity in this date range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
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
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total leads"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="processed"
                name="Converted"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function safeFormat(d: string): string {
  try {
    return format(parseISO(d), 'dd MMM')
  } catch {
    return d
  }
}
