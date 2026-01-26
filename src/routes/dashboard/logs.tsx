import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StandardPagination } from '@/components/common/StandardPagination'
import {
  useSystemLogs,
  useCleanupLogs,
  useExportLogs,
} from '@/hooks/api/useSystemLogs'
import { SystemLogDetailsSheet } from '@/components/system-logs/SystemLogDetailsSheet'
import { CleanupLogsDialog } from '@/components/system-logs/CleanupLogsDialog'
import { SystemLog } from '@/lib/api/types/system-logs.types'
import {
  FileClock,
  ShieldAlert,
  X,
  Eye,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemLogsSearch {
  page: number
  limit: number
  startDate?: string
  endDate?: string
}

export const Route = createFileRoute('/dashboard/logs')({
  component: LogsPage,
  validateSearch: (search: Record<string, unknown>): SystemLogsSearch => {
    return {
      page: Number(search?.page ?? 1),
      limit: Number(search?.limit ?? 10),
      startDate: (search?.startDate as string) || undefined,
      endDate: (search?.endDate as string) || undefined,
    }
  },
})

function LogsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  // Local state for filters
  const [startDate, setStartDate] = useState(searchParams.startDate || '')
  const [endDate, setEndDate] = useState(searchParams.endDate || '')

  // Sheet & Dialog state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)

  // API Hooks
  const { data, isLoading, error } = useSystemLogs({
    page: searchParams.page,
    limit: searchParams.limit,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  })

  const { mutate: cleanupLogs, isPending: isCleanupPending } = useCleanupLogs()
  const { mutate: exportLogs, isPending: isExportPending } = useExportLogs()

  const updateParams = (updates: Partial<SystemLogsSearch>) => {
    navigate({
      search: ((prev: SystemLogsSearch) => ({ ...prev, ...updates })) as any,
    })
  }

  const handleApplyFilters = () => {
    updateParams({
      page: 1, // Reset to page 1 on filter change
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    updateParams({
      page: 1,
      startDate: undefined,
      endDate: undefined,
    })
  }

  const handleRowClick = (log: SystemLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const handleCleanup = (date: Date) => {
    cleanupLogs(format(date, 'yyyy-MM-dd'), {
      onSuccess: () => {
        toast.success(
          t('systemLogs.cleanup.success', 'Logs cleaned up successfully'),
        )
        setCleanupOpen(false)
      },
      onError: () => {
        toast.error(t('systemLogs.cleanup.error', 'Failed to cleanup logs'))
      },
    })
  }

  const handleExport = () => {
    exportLogs(undefined, {
      onSuccess: () => {
        toast.success(
          t('systemLogs.export.success', 'Logs exported successfully'),
        )
      },
      onError: () => {
        toast.error(t('systemLogs.export.error', 'Failed to export logs'))
      },
    })
  }

  const hasActiveFilters = !!searchParams.startDate || !!searchParams.endDate

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin']}>
        <div className="p-4 text-red-500">
          {t('systemLogs.error', 'Error loading system logs')}
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t('systemLogs.title', 'System Logs')}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExportPending}
            >
              {isExportPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t('common.export', 'Export CSV')}
            </Button>
            <Button variant="destructive" onClick={() => setCleanupOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.cleanup', 'Cleanup')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {t('systemLogs.auditLog', 'Audit Log')}
            </CardTitle>
            <CardDescription>
              {t(
                'systemLogs.description',
                'Monitor system activities and user actions.',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-muted/20 p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {t('systemLogs.startDate', 'Start Date')}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  {t('systemLogs.endDate', 'End Date')}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2 lg:col-span-2">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleApplyFilters}
                  variant="default"
                >
                  {t('common.apply', 'Apply')}
                </Button>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="icon"
                    title={t('common.clearFilters', 'Clear Filters')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>{t('systemLogs.table.user', 'User')}</TableHead>
                    <TableHead>
                      {t('systemLogs.table.action', 'Action')}
                    </TableHead>
                    <TableHead>
                      {t('systemLogs.table.metadata', 'Metadata')}
                    </TableHead>
                    <TableHead>
                      {t('systemLogs.table.ip', 'IP Address')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('systemLogs.table.date', 'Date & Time')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48 mt-1" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-32 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <FileClock className="h-8 w-8 opacity-20" />
                          <p>{t('systemLogs.empty', 'No logs found')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors group"
                        onClick={() => handleRowClick(log)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {log.user?.name || log.userId}
                            </span>
                            {log.user?.email && (
                              <span className="text-xs text-muted-foreground">
                                {log.user.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {log.metadata?.method && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5"
                              >
                                {log.metadata.method}
                              </Badge>
                            )}
                            {(log.metadata?.body || log.metadata?.params) && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5"
                              >
                                JSON
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-3 w-3 mr-1" /> View
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.metadata?.ip || '-'}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), 'PP pp')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {data && (
                <StandardPagination
                  currentPage={data.meta.page}
                  totalPages={data.meta.totalPages}
                  totalItems={data.meta.total}
                  itemsPerPage={data.meta.limit}
                  onPageChange={(page) => updateParams({ page })}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SystemLogDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        log={selectedLog}
      />

      <CleanupLogsDialog
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        onConfirm={handleCleanup}
        isPending={isCleanupPending}
      />
    </RoleGuard>
  )
}
