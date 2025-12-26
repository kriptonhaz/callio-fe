import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLeadAssignments } from '@/hooks/api/useLeadAssignments'
import { useDebounce } from '@/hooks/useDebounce'
import { LeadStatus } from '@/lib/api/types'
import type { LeadAssignment } from '@/lib/api/types/lead-assignments.types'
import { EditLeadSheet } from './EditLeadSheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, Users } from 'lucide-react'

interface CampaignLeadsTableProps {
  campaignId: string
  clientId: string
}

export function CampaignLeadsTable({
  campaignId,
  clientId,
}: CampaignLeadsTableProps) {
  const { t } = useTranslation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [selectedAssignment, setSelectedAssignment] =
    useState<LeadAssignment | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const limit = 10

  const debouncedSearch = useDebounce(search, 300)

  const {
    data: leadsData,
    isLoading,
    refetch,
  } = useLeadAssignments({
    campaignId,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
  })

  const totalPages = leadsData?.meta?.totalPages || 1
  const totalItems = leadsData?.meta?.total || 0

  const getStatusBadge = (status: LeadStatus) => {
    const statusConfig: Record<
      LeadStatus,
      { className: string; label: string }
    > = {
      [LeadStatus.NEW]: {
        className:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: t('leads.status.new', 'New'),
      },
      [LeadStatus.ATTEMPTED]: {
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: t('leads.status.attempted', 'Attempted'),
      },
      [LeadStatus.HOT]: {
        className:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: t('leads.status.hot', 'Hot'),
      },
      [LeadStatus.WARM]: {
        className:
          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        label: t('leads.status.warm', 'Warm'),
      },
      [LeadStatus.COLD]: {
        className:
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        label: t('leads.status.cold', 'Cold'),
      },
      [LeadStatus.CLOSED]: {
        className:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        label: t('leads.status.closed', 'Closed'),
      },
    }

    const config = statusConfig[status] || statusConfig[LeadStatus.NEW]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleRowClick = (assignment: LeadAssignment) => {
    setSelectedAssignment(assignment)
    setIsEditSheetOpen(true)
  }

  const renderPaginationLinks = () => {
    const pages: number[] = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages.map((p) => (
      <PaginationItem key={p}>
        <PaginationLink
          onClick={() => setPage(p)}
          isActive={page === p}
          className="cursor-pointer"
        >
          {p}
        </PaginationLink>
      </PaginationItem>
    ))
  }

  return (
    <div className="space-y-4">
      {/* Filters - Search full width, filter on right */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('leads.searchPlaceholder', 'Search leads...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as LeadStatus | 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue
              placeholder={t('leads.filterByStatus', 'Filter by status')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
            <SelectItem value={LeadStatus.NEW}>
              {t('leads.status.new', 'New')}
            </SelectItem>
            <SelectItem value={LeadStatus.ATTEMPTED}>
              {t('leads.status.attempted', 'Attempted')}
            </SelectItem>
            <SelectItem value={LeadStatus.HOT}>
              {t('leads.status.hot', 'Hot')}
            </SelectItem>
            <SelectItem value={LeadStatus.WARM}>
              {t('leads.status.warm', 'Warm')}
            </SelectItem>
            <SelectItem value={LeadStatus.COLD}>
              {t('leads.status.cold', 'Cold')}
            </SelectItem>
            <SelectItem value={LeadStatus.CLOSED}>
              {t('leads.status.closed', 'Closed')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <TableRow>
              <TableHead className="font-semibold text-primary">
                {t('leads.name', 'Name')}
              </TableHead>
              <TableHead className="font-semibold text-primary">
                {t('leads.phone', 'Phone')}
              </TableHead>
              <TableHead className="font-semibold text-primary">
                {t('leads.email', 'Email')}
              </TableHead>
              <TableHead className="font-semibold text-primary">
                {t('leads.agent', 'Agent')}
              </TableHead>
              <TableHead className="font-semibold text-primary">
                {t('common.status', 'Status')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : leadsData?.data && leadsData.data.length > 0 ? (
              leadsData.data.map((assignment: LeadAssignment) => (
                <TableRow
                  key={assignment.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => handleRowClick(assignment)}
                >
                  <TableCell className="font-medium">
                    {assignment.lead?.leadName || '-'}
                  </TableCell>
                  <TableCell>{assignment.lead?.phone || '-'}</TableCell>
                  <TableCell>{assignment.lead?.email || '-'}</TableCell>
                  <TableCell>{assignment.assignedAgent?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>{t('leads.noLeadsFound', 'No leads found')}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.showingOf', 'Showing {{from}}-{{to}} of {{total}}', {
              from: (page - 1) * limit + 1,
              to: Math.min(page * limit, totalItems),
              total: totalItems,
            })}
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page <= 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {renderPaginationLinks()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page >= totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit Lead Sheet */}
      <EditLeadSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        assignment={selectedAssignment}
        clientId={clientId}
        campaignId={campaignId}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
