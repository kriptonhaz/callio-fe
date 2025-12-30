import React, { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import { useCallLogs } from '@/hooks/api/useRemainingModules'
import { useUsers } from '@/hooks/api/useUsers'
import { useCampaigns } from '@/hooks/api/useCampaigns'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useMe } from '@/hooks/api/useAuth'
import { UserRole } from '@/lib/api/types'
import { ServiceType } from '@/lib/api/types/services.types'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import {
  Download,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CallLogsQueryParams } from '@/lib/api/types/remaining-modules.types'

interface ReportsSearch {
  page: number
  limit: number
  disposition?: string
  agentId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
}

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>): ReportsSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
      disposition: (search.disposition as string) || undefined,
      agentId: (search.agentId as string) || undefined,
      campaignId: (search.campaignId as string) || undefined,
      startDate: (search.startDate as string) || undefined,
      endDate: (search.endDate as string) || undefined,
    }
  },
})

function ReportsPage(): React.ReactElement {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [activeTab, setActiveTab] = useState('voip')
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.startDate ? new Date(searchParams.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.endDate ? new Date(searchParams.endDate) : undefined,
  )
  const [campaignComboboxOpen, setCampaignComboboxOpen] = useState(false)
  const [agentComboboxOpen, setAgentComboboxOpen] = useState(false)

  // Auth context
  const { data: me } = useMe()
  const clientId = me?.clientId

  // Fetch enabled services for this client
  const { data: enabledServices } = useEnabledServices(clientId)

  // Check which services are enabled
  const hasVoipService = useMemo(() => {
    return (
      enabledServices?.some(
        (s) => s.serviceType === ServiceType.VOICE && s.isEnabled,
      ) ?? false
    )
  }, [enabledServices])

  const hasSmsService = useMemo(() => {
    return (
      enabledServices?.some(
        (s) => s.serviceType === ServiceType.SMS && s.isEnabled,
      ) ?? false
    )
  }, [enabledServices])

  const hasWhatsappService = useMemo(() => {
    return (
      enabledServices?.some(
        (s) => s.serviceType === ServiceType.WHATSAPP && s.isEnabled,
      ) ?? false
    )
  }, [enabledServices])

  // Set default tab based on available services
  React.useEffect(() => {
    if (hasVoipService) {
      setActiveTab('voip')
    } else if (hasSmsService) {
      setActiveTab('sms')
    } else if (hasWhatsappService) {
      setActiveTab('whatsapp')
    }
  }, [hasVoipService, hasSmsService, hasWhatsappService])

  // Build query params
  const queryParams: CallLogsQueryParams = useMemo(() => {
    const params: CallLogsQueryParams = {
      page: searchParams.page,
      limit: searchParams.limit,
    }
    if (searchParams.disposition && searchParams.disposition !== 'all') {
      params.disposition = searchParams.disposition
    }
    if (searchParams.agentId && searchParams.agentId !== 'all') {
      params.agentId = searchParams.agentId
    }
    if (searchParams.campaignId && searchParams.campaignId !== 'all') {
      params.campaignId = searchParams.campaignId
    }
    if (searchParams.startDate) {
      params.startDate = searchParams.startDate
    }
    if (searchParams.endDate) {
      params.endDate = searchParams.endDate
    }
    return params
  }, [searchParams])

  // Fetch call logs
  const { data: callLogsData, isLoading } = useCallLogs(queryParams)

  // Fetch agents for filter (only users with agent role)
  const { data: usersData } = useUsers({
    clientId,
    role: UserRole.AGENT,
    limit: 100,
  })
  const agents = usersData?.data || []

  // Fetch campaigns for filter
  const { data: campaignsData } = useCampaigns({ clientId, limit: 100 })
  const campaigns = campaignsData?.data || []

  // Navigation helpers
  const updateParams = (updates: Partial<ReportsSearch>): void => {
    void navigate({
      to: '/dashboard/reports',
      search: {
        page: searchParams.page,
        limit: searchParams.limit,
        disposition: searchParams.disposition,
        agentId: searchParams.agentId,
        campaignId: searchParams.campaignId,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        ...updates,
      },
    })
  }

  const handlePageChange = (newPage: number): void => {
    updateParams({ page: newPage })
  }

  const handleDispositionFilter = (disposition: string): void => {
    updateParams({
      disposition: disposition === 'all' ? undefined : disposition,
      page: 1,
    })
  }

  const handleAgentFilter = (agentId: string): void => {
    updateParams({ agentId: agentId === 'all' ? undefined : agentId, page: 1 })
  }

  const handleCampaignFilter = (campaignId: string): void => {
    updateParams({
      campaignId: campaignId === 'all' ? undefined : campaignId,
      page: 1,
    })
  }

  const handleStartDateChange = (date: Date | undefined): void => {
    setStartDate(date)
    updateParams({
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
      page: 1,
    })
  }

  const handleEndDateChange = (date: Date | undefined): void => {
    setEndDate(date)
    updateParams({
      endDate: date ? format(date, 'yyyy-MM-dd') : undefined,
      page: 1,
    })
  }

  // Format date and time
  const formatDateTime = (
    dateString: string,
  ): { date: string; time: string } => {
    const dateObj = new Date(dateString)
    return {
      date: format(dateObj, 'MMM dd, yyyy'),
      time: format(dateObj, 'hh:mm a'),
    }
  }

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format phone number
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '-'
    // Simple formatting, assuming Indonesian numbers
    return phone.replace(/(\+\d{2})(\d{3})(\d{4})(\d{4})/, '$1 $2 $3 $4')
  }

  // Get disposition badge
  const getDispositionBadge = (
    disposition: string | null | undefined,
  ): React.ReactElement => {
    const dispositionConfig: Record<
      string,
      { className: string; label: string; dotClass: string }
    > = {
      answered: {
        className:
          'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200',
        label: t('reports.answered', 'Answered'),
        dotClass: 'bg-green-500',
      },
      no_answer: {
        className:
          'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200',
        label: t('reports.noAnswer', 'No Answer'),
        dotClass: 'bg-yellow-500',
      },
      busy: {
        className:
          'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200',
        label: t('reports.busy', 'Busy'),
        dotClass: 'bg-orange-500',
      },
      voicemail: {
        className:
          'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200',
        label: t('reports.voicemail', 'Voicemail'),
        dotClass: 'bg-purple-500',
      },
      wrong_number: {
        className:
          'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200',
        label: t('reports.wrongNumber', 'Wrong Number'),
        dotClass: 'bg-red-500',
      },
      callback_requested: {
        className:
          'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200',
        label: t('reports.callbackRequested', 'Callback Requested'),
        dotClass: 'bg-blue-500',
      },
      not_interested: {
        className:
          'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200',
        label: t('reports.notInterested', 'Not Interested'),
        dotClass: 'bg-gray-500',
      },
      interested: {
        className:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200',
        label: t('reports.interested', 'Interested'),
        dotClass: 'bg-emerald-500',
      },
      disconnected: {
        className:
          'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200',
        label: t('reports.disconnected', 'Disconnected'),
        dotClass: 'bg-slate-500',
      },
      invalid_number: {
        className:
          'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200',
        label: t('reports.invalidNumber', 'Invalid Number'),
        dotClass: 'bg-red-500',
      },
      failed: {
        className:
          'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200',
        label: t('reports.failed', 'Failed'),
        dotClass: 'bg-red-500',
      },
    }

    const key = disposition || 'failed'
    const config = dispositionConfig[key] || dispositionConfig.failed

    return (
      <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </Badge>
    )
  }

  // Pagination
  const totalPages = callLogsData?.meta.totalPages || 1
  const currentPage = searchParams.page
  const totalItems = callLogsData?.meta.total || 0
  const itemsPerPage = searchParams.limit
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages - 1, totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages,
        )
      }
    }
    return pages
  }

  // No services available
  const noServicesAvailable =
    !hasVoipService && !hasSmsService && !hasWhatsappService

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('reports.title', 'Reports')}
          </h1>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4" />
            {t('reports.exportReport', 'Export Report')}
          </Button>
        </div>

        {noServicesAvailable ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Phone className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">
              {t('reports.noServices', 'No Active Services')}
            </h3>
            <p className="text-sm">
              {t(
                'reports.noServicesDescription',
                'Contact your administrator to enable services.',
              )}
            </p>
          </div>
        ) : (
          /* Tabs */
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-transparent border-0 rounded-none p-0 h-auto w-full justify-start gap-6">
              {hasVoipService && (
                <TabsTrigger
                  value="voip"
                  className="border-0 border-b-2 border-b-transparent bg-transparent shadow-none rounded-none px-1 pb-3 pt-0 gap-2 text-muted-foreground data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary focus-visible:ring-0 focus-visible:border-0 focus-visible:border-b-2"
                >
                  <Phone className="h-4 w-4" />
                  {t('reports.voipCallLogs', 'VoIP Call Logs')}
                </TabsTrigger>
              )}
              {hasSmsService && (
                <TabsTrigger
                  value="sms"
                  className="border-0 border-b-2 border-b-transparent bg-transparent shadow-none rounded-none px-1 pb-3 pt-0 gap-2 text-muted-foreground data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary focus-visible:ring-0 focus-visible:border-0 focus-visible:border-b-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('reports.smsReports', 'SMS Reports')}
                </TabsTrigger>
              )}
              {hasWhatsappService && (
                <TabsTrigger
                  value="whatsapp"
                  className="border-0 border-b-2 border-b-transparent bg-transparent shadow-none rounded-none px-1 pb-3 pt-0 gap-2 text-muted-foreground data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary focus-visible:ring-0 focus-visible:border-0 focus-visible:border-b-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('reports.whatsappReports', 'WhatsApp Reports')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* VoIP Call Logs Tab */}
            {hasVoipService && (
              <TabsContent value="voip" className="space-y-0 mt-0">
                {/* Filters Card */}
                <div className="rounded-t-lg border border-b-0 bg-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Start Date Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[150px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, 'MM/dd/yyyy')
                            ) : (
                              <span className="text-muted-foreground">
                                {t('reports.startDate', 'Start Date')}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleStartDateChange}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* End Date Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[150px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, 'MM/dd/yyyy')
                            ) : (
                              <span className="text-muted-foreground">
                                {t('reports.endDate', 'End Date')}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={handleEndDateChange}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Campaign Filter - Searchable Combobox */}
                      <Popover
                        open={campaignComboboxOpen}
                        onOpenChange={setCampaignComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={campaignComboboxOpen}
                            className="w-[180px] justify-between"
                          >
                            {searchParams.campaignId &&
                            searchParams.campaignId !== 'all'
                              ? campaigns.find(
                                  (c) => c.id === searchParams.campaignId,
                                )?.name
                              : t('reports.allCampaigns', 'All Campaigns')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchCampaign',
                                'Search campaign...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t(
                                  'reports.noCampaignFound',
                                  'No campaign found.',
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleCampaignFilter('all')
                                    setCampaignComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.campaignId ||
                                        searchParams.campaignId === 'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allCampaigns', 'All Campaigns')}
                                </CommandItem>
                                {campaigns.map((campaign) => (
                                  <CommandItem
                                    key={campaign.id}
                                    value={campaign.name}
                                    onSelect={() => {
                                      handleCampaignFilter(campaign.id)
                                      setCampaignComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.campaignId === campaign.id
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {campaign.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Agent Filter - Searchable Combobox */}
                      <Popover
                        open={agentComboboxOpen}
                        onOpenChange={setAgentComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={agentComboboxOpen}
                            className="w-[160px] justify-between"
                          >
                            {searchParams.agentId &&
                            searchParams.agentId !== 'all'
                              ? agents.find(
                                  (a) => a.id === searchParams.agentId,
                                )?.name
                              : t('reports.allAgents', 'All Agents')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchAgent',
                                'Search agent...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t('reports.noAgentFound', 'No agent found.')}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleAgentFilter('all')
                                    setAgentComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.agentId ||
                                        searchParams.agentId === 'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allAgents', 'All Agents')}
                                </CommandItem>
                                {agents.map((agent) => (
                                  <CommandItem
                                    key={agent.id}
                                    value={agent.name}
                                    onSelect={() => {
                                      handleAgentFilter(agent.id)
                                      setAgentComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.agentId === agent.id
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {agent.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Status Filter (uses disposition) */}
                      <Select
                        value={searchParams.disposition || 'all'}
                        onValueChange={handleDispositionFilter}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue
                            placeholder={t(
                              'reports.allStatuses',
                              'All Statuses',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('reports.allStatuses', 'All Statuses')}
                          </SelectItem>
                          <SelectItem value="answered">
                            {t('reports.answered', 'Answered')}
                          </SelectItem>
                          <SelectItem value="no_answer">
                            {t('reports.noAnswer', 'No Answer')}
                          </SelectItem>
                          <SelectItem value="busy">
                            {t('reports.busy', 'Busy')}
                          </SelectItem>
                          <SelectItem value="voicemail">
                            {t('reports.voicemail', 'Voicemail')}
                          </SelectItem>
                          <SelectItem value="wrong_number">
                            {t('reports.wrongNumber', 'Wrong Number')}
                          </SelectItem>
                          <SelectItem value="callback_requested">
                            {t(
                              'reports.callbackRequested',
                              'Callback Requested',
                            )}
                          </SelectItem>
                          <SelectItem value="not_interested">
                            {t('reports.notInterested', 'Not Interested')}
                          </SelectItem>
                          <SelectItem value="interested">
                            {t('reports.interested', 'Interested')}
                          </SelectItem>
                          <SelectItem value="disconnected">
                            {t('reports.disconnected', 'Disconnected')}
                          </SelectItem>
                          <SelectItem value="invalid_number">
                            {t('reports.invalidNumber', 'Invalid Number')}
                          </SelectItem>
                          <SelectItem value="failed">
                            {t('reports.failed', 'Failed')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results count */}
                    <div className="text-sm text-muted-foreground">
                      {t(
                        'reports.showingOf',
                        'Showing {{start}}-{{end}} of {{total}} logs',
                        {
                          start: startItem,
                          end: endItem,
                          total: totalItems,
                        },
                      )}
                    </div>
                  </div>
                </div>

                {/* Table with footer pagination */}
                <div className="rounded-b-lg border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.dateTime', 'DATE & TIME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.agentName', 'AGENT NAME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.campaignName', 'CAMPAIGN NAME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.leadsName', 'LEADS NAME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.duration', 'DURATION')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.status', 'STATUS')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                          {t('reports.actions', 'ACTION')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('common.loading', 'Loading...')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : callLogsData?.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Phone className="h-8 w-8" />
                              <p>
                                {t('reports.noCallLogs', 'No call logs found')}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        callLogsData?.data.map((log) => {
                          const { date, time } = formatDateTime(log.startTime)
                          // Extract extension from sipChannel (e.g., "PJSIP/1004-00000011" -> "1004")
                          const extension =
                            log.sipChannel?.match(/PJSIP\/(\d+)/)?.[1] || '-'
                          return (
                            <TableRow
                              key={log.id}
                              className="hover:bg-muted/30"
                            >
                              {/* Date & Time */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{date}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {time}
                                  </span>
                                </div>
                              </TableCell>
                              {/* Agent Name (with extension) */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {log.agent?.name || '-'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    Ext: {extension}
                                  </span>
                                </div>
                              </TableCell>
                              {/* Campaign Name */}
                              <TableCell>
                                <span
                                  className={
                                    log.campaign?.name
                                      ? ''
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {log.campaign?.name || '-'}
                                </span>
                              </TableCell>
                              {/* Leads Name (with phone) */}
                              <TableCell>
                                {log.lead ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {log.lead.leadName}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatPhoneNumber(log.lead.phone)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatPhoneNumber(log.phoneNumber)}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              {/* Duration */}
                              <TableCell className="text-muted-foreground">
                                {formatDuration(log.billableSeconds)}
                              </TableCell>
                              {/* Status */}
                              <TableCell>
                                {getDispositionBadge(log.disposition)}
                              </TableCell>
                              {/* Action */}
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination Footer - inside the table card */}
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      {t(
                        'reports.showingResults',
                        'Showing {{start}} to {{end}} of {{total}} results',
                        {
                          start: startItem,
                          end: endItem,
                          total: totalItems,
                        },
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {getPageNumbers().map((page, index) => (
                        <Button
                          key={index}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="icon"
                          className={`h-8 w-8 ${page === currentPage ? 'bg-primary text-primary-foreground border-primary' : ''}`}
                          disabled={page === '...'}
                          onClick={() =>
                            typeof page === 'number' && handlePageChange(page)
                          }
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* SMS Reports Tab - Placeholder */}
            {hasSmsService && (
              <TabsContent value="sms" className="mt-0">
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">
                    {t('reports.smsReportsTitle', 'SMS Reports')}
                  </h3>
                  <p className="text-sm">
                    {t('reports.comingSoon', 'Coming soon...')}
                  </p>
                </div>
              </TabsContent>
            )}

            {/* WhatsApp Reports Tab - Placeholder */}
            {hasWhatsappService && (
              <TabsContent value="whatsapp" className="mt-0">
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">
                    {t('reports.whatsappReportsTitle', 'WhatsApp Reports')}
                  </h3>
                  <p className="text-sm">
                    {t('reports.comingSoon', 'Coming soon...')}
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </RoleGuard>
  )
}
