import { useState } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import type { PerformanceListParams } from '@/lib/api/types/performance.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StandardPagination } from '@/components/common/StandardPagination'
import { LeadStatusBadge } from '@/components/lead-status/LeadStatusBadge'
import { Badge } from '@/components/ui/badge'
import { usePerformanceLeads } from '@/hooks/api/usePerformance'

interface Props {
  baseFilters: Omit<PerformanceListParams, 'page' | 'limit'>
}

const PAGE_SIZE = 10

export function PerLeadDetail({ baseFilters }: Props) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePerformanceLeads({
    ...baseFilters,
    page,
    limit: PAGE_SIZE,
  })

  const rows = data?.data ?? []
  const meta = data?.meta

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-lead detail</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No leads matched this date range or filter.
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead>Last call</TableHead>
                    <TableHead>Current outcome</TableHead>
                    <TableHead>Last contacted</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.leadId}-${r.campaignId}`}>
                      <TableCell className="font-medium">
                        {r.leadName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.phone}
                      </TableCell>
                      <TableCell>{r.agentName ?? '—'}</TableCell>
                      <TableCell>{r.campaignName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.attempts}
                      </TableCell>
                      <TableCell>
                        {r.lastCallStatus ? (
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs"
                          >
                            {r.lastCallStatus.replace(/_/g, ' ')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge slug={r.currentStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {r.lastContactedAt
                          ? format(
                              new Date(r.lastContactedAt),
                              'dd MMM HH:mm',
                            )
                          : '—'}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                        {r.leadProgressNotes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {meta && meta.totalPages > 1 && (
              <StandardPagination
                currentPage={page}
                totalPages={meta.totalPages}
                totalItems={meta.total}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
