import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  Download,
  HelpCircle,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/lib/api/types/leads.types'
import type { LeadAssignment } from '@/lib/api/types/lead-assignments.types'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useBulkCheckLeadWhatsApp,
  useBulkDeleteLeads,
  useBulkDeleteLeadsByFilter,
  useBulkImportLeads,
  useDeleteLead,
  useLeads,
} from '@/hooks/api/useLeads'
import { useWhatsAppInstances } from '@/hooks/api/useWhatsapp'
import { useMe } from '@/hooks/api/useAuth'
import sampleCsvUrl from '@/assets/data/sample-leads-import.csv?url'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDebounce } from '@/hooks/useDebounce'
import { AddLeadSheet } from '@/components/campaigns/AddLeadSheet'
import { EditLeadSheet } from '@/components/campaigns/EditLeadSheet'
import { SYSTEM_SLUGS } from '@/lib/lead-status/constants'
import { StandardPagination } from '@/components/common/StandardPagination'
import { WhatsAppInstanceSelector } from '@/components/leads/WhatsAppInstanceSelector'

interface LeadsSearch {
  page: number
  limit: number
  search?: string
  gender?: string
  city?: string
  province?: string
}

export const Route = createFileRoute('/dashboard/leads/')({
  component: LeadsPage,
  validateSearch: (search: Record<string, unknown>): LeadsSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
      search: (search.search as string) || undefined,
      gender: (search.gender as string) || undefined,
      city: (search.city as string) || undefined,
      province: (search.province as string) || undefined,
    }
  },
})

function LeadsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const [searchValue, setSearchValue] = useState(searchParams.search || '')
  const [isAddLeadSheetOpen, setIsAddLeadSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Array<string>>([])
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [instanceSelectorOpen, setInstanceSelectorOpen] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 500)

  // Auth context
  const { data: me } = useMe()
  const clientId = me?.clientId
  const userRole = me?.role
  const isAdmin = userRole === 'admin'

  // API hooks
  const {
    data: leadsData,
    isLoading,
    refetch,
  } = useLeads({
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
  })

  const { mutate: bulkImport, isPending: isImporting } = useBulkImportLeads()
  const { mutate: deleteLead, isPending: isDeleting } = useDeleteLead()
  const { mutate: bulkDeleteLeads, isPending: isBulkDeleting } =
    useBulkDeleteLeads()
  const {
    mutate: bulkDeleteLeadsByFilter,
    isPending: isBulkDeletingByFilter,
  } = useBulkDeleteLeadsByFilter()
  const { mutate: bulkCheckWhatsApp, isPending: isBulkChecking } =
    useBulkCheckLeadWhatsApp()
  const { data: whatsappInstances } = useWhatsAppInstances()
  const connectedBaileysInstances = (whatsappInstances ?? []).filter(
    (i) => i.providerType === 'baileys' && i.status === 'connected',
  )

  // Navigation helpers
  const updateParams = (updates: Partial<LeadsSearch>) => {
    navigate({
      search: ((prev: any) => ({ ...prev, ...updates })) as any,
    })
  }

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    updateParams({ search: value || undefined, page: 1 })
  }

  const handleGenderFilter = (gender: string) => {
    updateParams({
      gender: gender === 'all' ? undefined : gender,
      page: 1,
    })
  }

  const getGenderBadge = (gender: string | null | undefined) => {
    if (!gender) return <span className="text-muted-foreground text-sm">-</span>

    const genderConfig: Record<string, { className: string; label: string }> = {
      male: {
        className:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: t('leads.male', 'Male'),
      },
      female: {
        className:
          'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
        label: t('leads.female', 'Female'),
      },
      other: {
        className:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        label: t('leads.other', 'Other'),
      },
    }

    const config = genderConfig[gender.toLowerCase()] || {
      className: 'bg-gray-100 text-gray-800',
      label: gender,
    }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsEditSheetOpen(true)
  }

  const openDeleteDialog = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    setLeadToDelete(lead)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!leadToDelete) return

    deleteLead(leadToDelete.id, {
      onSuccess: () => {
        toast.success(t('leads.deleted', 'Lead deleted successfully'))
        setDeleteDialogOpen(false)
        setLeadToDelete(null)
      },
      onError: () => {
        toast.error(t('leads.deleteFailed', 'Failed to delete lead'))
      },
    })
  }

  const handleBulkDelete = () => {
    if (selectAllAcrossPages) {
      bulkDeleteLeadsByFilter(
        {
          search: debouncedSearch || undefined,
          confirm: true,
        },
        {
          onSuccess: (data) => {
            toast.success(
              t(
                'leads.bulkDeleted',
                `Successfully deleted {{count}} lead(s)`,
                { count: data.deleted },
              ),
            )
            setSelectedLeadIds([])
            setSelectAllAcrossPages(false)
            setBulkDeleteDialogOpen(false)
          },
          onError: () => {
            toast.error(t('leads.bulkDeleteFailed', 'Failed to delete leads'))
          },
        },
      )
      return
    }

    if (selectedLeadIds.length === 0) return

    bulkDeleteLeads(selectedLeadIds, {
      onSuccess: () => {
        toast.success(
          t('leads.bulkDeleted', `Successfully deleted {{count}} lead(s)`, {
            count: selectedLeadIds.length,
          }),
        )
        setSelectedLeadIds([])
        setBulkDeleteDialogOpen(false)
      },
      onError: () => {
        toast.error(t('leads.bulkDeleteFailed', 'Failed to delete leads'))
      },
    })
  }

  const handleBulkCheckWhatsApp = (instanceId: string) => {
    setInstanceSelectorOpen(false)
    const uncheckedIds = selectedLeadIds.filter((id) => {
      const lead = leadsData?.data.find((l) => l.id === id)
      return lead?.hasWhatsapp == null
    })
    if (uncheckedIds.length === 0) {
      toast.info(
        t('leads.allAlreadyChecked', 'All selected leads have already been checked'),
      )
      return
    }
    const leadIds = uncheckedIds.slice(0, 500)
    bulkCheckWhatsApp(
      { instanceId, leadIds },
      {
        onSuccess: (data) => {
          toast.success(
            t(
              'leads.whatsappCheckComplete',
              `Checked {{total}} leads: {{hasWhatsapp}} have WhatsApp, {{noWhatsapp}} don't`,
              {
                total: data.summary.total,
                hasWhatsapp: data.summary.hasWhatsapp,
                noWhatsapp: data.summary.noWhatsapp,
              },
            ),
          )
          setSelectedLeadIds([])
        },
        onError: () => {
          toast.error(
            t('leads.whatsappCheckFailed', 'Failed to check WhatsApp numbers'),
          )
        },
      },
    )
  }

  const handleCheckWhatsAppClick = () => {
    if (connectedBaileysInstances.length === 1) {
      handleBulkCheckWhatsApp(connectedBaileysInstances[0].id)
    } else {
      setInstanceSelectorOpen(true)
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    // Changing an individual row exits "all across pages" mode — the user
    // is back to working with concrete ids.
    if (selectAllAcrossPages) setSelectAllAcrossPages(false)
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leadsData?.data.length) {
      setSelectedLeadIds([])
      setSelectAllAcrossPages(false)
    } else {
      setSelectedLeadIds(leadsData?.data.map((lead) => lead.id) || [])
    }
  }

  const isAllSelected =
    (leadsData?.data?.length ?? 0) > 0 &&
    selectedLeadIds.length === (leadsData?.data?.length ?? 0)

  const totalLeads = leadsData?.meta.total ?? 0
  const pageSize = leadsData?.data.length ?? 0
  const showSelectAllBanner = isAllSelected && totalLeads > pageSize

  const handleDownloadSample = () => {
    const link = document.createElement('a')
    link.href = sampleCsvUrl
    link.download = 'sample-leads-import.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t('leads.sampleDownloaded', 'Sample CSV downloaded'))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error(
        t(
          'leads.invalidFileType',
          'Invalid file type. Only CSV files are allowed.',
        ),
      )
      event.target.value = ''
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(
        t(
          'leads.fileTooLarge',
          'File size exceeds 5MB limit. Please choose a smaller file.',
        ),
      )
      event.target.value = ''
      return
    }

    // Create FormData without campaignIds
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId!)
    // No campaignIds for leads page

    bulkImport(formData, {
      onSuccess: (data) => {
        toast.success(
          t(
            'leads.importSuccess',
            `Imported ${data.created + data.reused} leads: ${data.created} new, ${data.reused} existing.`,
          ),
        )
        event.target.value = ''
        refetch()
      },
      onError: () => {
        toast.error(t('leads.importFailed', 'Failed to import leads from CSV.'))
        event.target.value = ''
      },
    })
  }

  // Convert Lead to LeadAssignment format for EditLeadSheet
  const convertToAssignment = (lead: Lead): LeadAssignment | null => {
    if (!lead) return null
    return {
      id: lead.id,
      leadId: lead.id,
      campaignId: '', // No campaign association from leads page
      assignedAgentId: null,
      status: lead.status || SYSTEM_SLUGS.NEW,
      priority: 'normal',
      lastCallStatus: null,
      lastCallDate: null,
      nextFollowUpDate: null,
      notes: lead.notes || null,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt || lead.createdAt,
      lead: lead,
      assignedAgent: undefined,
    } as LeadAssignment
  }

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t('leads.title', 'Leads')}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {selectedLeadIds.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckWhatsAppClick}
                  disabled={
                    connectedBaileysInstances.length === 0 || isBulkChecking
                  }
                  title={
                    connectedBaileysInstances.length === 0
                      ? t(
                          'leads.noWhatsappInstance',
                          'No connected WhatsApp instance available',
                        )
                      : undefined
                  }
                >
                  {isBulkChecking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  {t('leads.checkWhatsapp', 'Check WhatsApp')} (
                  {(() => {
                    const unchecked = selectedLeadIds.filter((id) => {
                      const lead = leadsData?.data.find((l) => l.id === id)
                      return lead?.hasWhatsapp == null
                    }).length
                    return unchecked > 500 ? 500 : unchecked
                  })()})
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('leads.deleteSelected', 'Delete')} (
                    {selectAllAcrossPages ? totalLeads : selectedLeadIds.length}
                    )
                  </Button>
                )}
              </>
            )}
            {isAdmin && (
              <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t('leads.downloadSample', 'Download Sample')}
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('csv-upload')?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {t('leads.import', 'Import')}
                </span>
              </Button>
              <Button
                className="gap-2 flex-1 sm:flex-none"
                onClick={() => setIsAddLeadSheetOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('leads.addLead', 'Add Lead')}
              </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                {t('leads.list', 'Leads List')}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t(
                      'leads.searchPlaceholder',
                      'Search by name, phone, or email...',
                    )}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={searchParams.gender || 'all'}
                  onValueChange={handleGenderFilter}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue
                      placeholder={t('leads.filterGender', 'Filter gender')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('common.all', 'All')}
                    </SelectItem>
                    <SelectItem value="male">
                      {t('leads.male', 'Male')}
                    </SelectItem>
                    <SelectItem value="female">
                      {t('leads.female', 'Female')}
                    </SelectItem>
                    <SelectItem value="other">
                      {t('leads.other', 'Other')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isAdmin && showSelectAllBanner && (
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                {selectAllAcrossPages ? (
                  <>
                    <span>
                      {t(
                        'leads.allAcrossPagesSelected',
                        'All {{total}} leads matching your filter are selected.',
                        { total: totalLeads },
                      )}
                    </span>
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline self-start sm:self-auto"
                      onClick={() => setSelectAllAcrossPages(false)}
                    >
                      {t('leads.clearSelection', 'Clear selection')}
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      {t(
                        'leads.allOnPageSelected',
                        'All {{count}} leads on this page are selected.',
                        { count: selectedLeadIds.length },
                      )}
                    </span>
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline self-start sm:self-auto"
                      onClick={() => setSelectAllAcrossPages(true)}
                    >
                      {t(
                        'leads.selectAllMatching',
                        'Select all {{total}} matching filter',
                        { total: totalLeads },
                      )}
                      {' →'}
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.name', 'Name')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.phone', 'Phone')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary text-center w-20">
                      {t('leads.whatsapp', 'WA')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.email', 'Email')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.gender', 'Gender')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.city', 'City')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('leads.province', 'Province')}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-primary">
                      {t('common.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('common.loading', 'Loading...')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : leadsData?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <UsersIcon className="h-8 w-8" />
                          <p>{t('leads.noLeadsFound', 'No leads found')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leadsData?.data.map((lead: Lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => handleRowClick(lead)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.leadName}
                        </TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell className="text-center">
                          {lead.hasWhatsapp === true ? (
                            <CheckCircle className="h-4 w-4 text-green-500 inline-block" />
                          ) : lead.hasWhatsapp === false ? (
                            <XCircle className="h-4 w-4 text-red-500 inline-block" />
                          ) : (
                            <HelpCircle className="h-4 w-4 text-muted-foreground inline-block" />
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.email || (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getGenderBadge(lead.gender)}</TableCell>
                        <TableCell>
                          {lead.city || (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.province || (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => openDeleteDialog(e, lead)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete', 'Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              {leadsData && (
                <StandardPagination
                  currentPage={searchParams.page}
                  totalPages={leadsData.meta.totalPages}
                  totalItems={leadsData.meta.total}
                  itemsPerPage={searchParams.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Lead Sheet */}
        <AddLeadSheet
          open={isAddLeadSheetOpen}
          onOpenChange={setIsAddLeadSheetOpen}
          clientId={clientId!}
          campaignId="" // Empty array will be handled in the component
          onSuccess={() => refetch()}
        />

        {/* Edit Lead Sheet */}
        {selectedLead && (
          <EditLeadSheet
            open={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
            assignment={convertToAssignment(selectedLead)}
            clientId={clientId!}
            campaignId="" // No campaign context from leads page
            showAssignment={false} // Hide assignment section on leads page
            onSuccess={() => {
              setIsEditSheetOpen(false)
              setSelectedLead(null)
              refetch()
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('leads.confirmDeleteTitle', 'Delete lead?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'leads.confirmDeleteDescription',
                  'Are you sure you want to delete {{leadName}}? This action cannot be undone.',
                  { leadName: leadToDelete?.leadName || 'this lead' },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t('common.cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('leads.confirmBulkDeleteTitle', 'Delete selected leads?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'leads.confirmBulkDeleteDescription',
                  'Are you sure you want to delete {{count}} lead(s)? This action cannot be undone.',
                  {
                    count: selectAllAcrossPages
                      ? totalLeads
                      : selectedLeadIds.length,
                  },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isBulkDeleting || isBulkDeletingByFilter}
              >
                {t('common.cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isBulkDeleting || isBulkDeletingByFilter}
                className="bg-red-600 hover:bg-red-700"
              >
                {(isBulkDeleting || isBulkDeletingByFilter) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* WhatsApp Instance Selector Dialog */}
        <WhatsAppInstanceSelector
          open={instanceSelectorOpen}
          onOpenChange={setInstanceSelectorOpen}
          instances={connectedBaileysInstances}
          onSelect={handleBulkCheckWhatsApp}
          isLoading={isBulkChecking}
        />
      </div>
    </RoleGuard>
  )
}
