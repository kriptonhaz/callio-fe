import React, { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import { useCallLogs } from '@/hooks/api/useRemainingModules'
import { useSmsHistory } from '@/hooks/api/useSms'
import { useUsers } from '@/hooks/api/useUsers'
import { useCampaigns } from '@/hooks/api/useCampaigns'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useMe } from '@/hooks/api/useAuth'
import { useAiUsage } from '@/hooks/api/useAiUsage'
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
import { Input } from '@/components/ui/input'
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
  Loader2,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  BrainCircuit,
  AlertCircle,
  MoreHorizontal,
  Play,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CallLogsQueryParams } from '@/lib/api/types/remaining-modules.types'
import {
  SmsStatus,
  type SmsHistoryQueryParams,
} from '@/lib/api/types/sms.types'

import { StandardPagination } from '@/components/common/StandardPagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface ReportsSearch {
  page: number
  limit: number
  disposition?: string
  status?: SmsStatus
  agentId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
  aiServiceType?: string
  aiStatus?: string
  search?: string
}

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>): ReportsSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
      disposition: (search.disposition as string) || undefined,
      status: (search.status as SmsStatus) || undefined,
      agentId: (search.agentId as string) || undefined,
      campaignId: (search.campaignId as string) || undefined,
      startDate: (search.startDate as string) || undefined,
      endDate: (search.endDate as string) || undefined,
      aiServiceType: (search.aiServiceType as string) || undefined,
      aiStatus: (search.aiStatus as string) || undefined,
      search: (search.search as string) || undefined,
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
  const [voipStatusOpen, setVoipStatusOpen] = useState(false)
  const [smsStatusOpen, setSmsStatusOpen] = useState(false)
  const [aiStatusOpen, setAiStatusOpen] = useState(false)
  const [aiServiceOpen, setAiServiceOpen] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)
  const [audioDialogOpen, setAudioDialogOpen] = useState(false)

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

  const hasAiService = useMemo(() => {
    return (
      enabledServices?.some(
        (s) => s.serviceType === ServiceType.AI && s.isEnabled,
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
    } else if (hasAiService) {
      setActiveTab('ai')
    }
  }, [hasVoipService, hasSmsService, hasWhatsappService, hasAiService])

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
  // Build SMS query params
  const smsQueryParams: SmsHistoryQueryParams = useMemo(() => {
    const params: SmsHistoryQueryParams = {
      page: searchParams.page,
      limit: searchParams.limit,
    }
    if (searchParams.status && searchParams.status !== ('all' as SmsStatus)) {
      params.status = searchParams.status
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
    if (searchParams.search) {
      params.search = searchParams.search
    }
    return params
  }, [searchParams])

  // Build AI query params
  const aiQueryParams: any = useMemo(() => {
    const params: any = {
      page: searchParams.page,
      limit: searchParams.limit,
    }
    if (searchParams.aiServiceType && searchParams.aiServiceType !== 'all') {
      params.serviceType = searchParams.aiServiceType
    }
    if (searchParams.aiStatus && searchParams.aiStatus !== 'all') {
      params.status = searchParams.aiStatus
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
  const { data: callLogsData, isLoading: isLoadingCallLogs } =
    useCallLogs(queryParams)

  // Fetch SMS history
  const { data: smsHistoryData, isLoading: isLoadingSmsHistory } =
    useSmsHistory(smsQueryParams)

  // Fetch AI usage
  const { data: aiUsageData, isLoading: isLoadingAiUsage } =
    useAiUsage(aiQueryParams)

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
        status: searchParams.status,
        agentId: searchParams.agentId,
        campaignId: searchParams.campaignId,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        aiServiceType: searchParams.aiServiceType,
        aiStatus: searchParams.aiStatus,
        ...updates,
      },
    })
  }

  const handlePageChange = (newPage: number): void => {
    updateParams({ page: newPage })
  }

  const handleExport = (type: string): void => {
    // Placeholder for export functionality
    console.log(`Exporting ${type} report`)
  }

  const handleDispositionFilter = (disposition: string): void => {
    updateParams({
      disposition: disposition === 'all' ? undefined : disposition,
      page: 1,
    })
  }

  const handleSmsStatusFilter = (status: string): void => {
    updateParams({
      status: status === 'all' ? undefined : (status as SmsStatus),
      page: 1,
    })
  }

  const handleAiServiceTypeFilter = (serviceType: string): void => {
    updateParams({
      aiServiceType: serviceType === 'all' ? undefined : serviceType,
      page: 1,
    })
  }

  const handleAiStatusFilter = (status: string): void => {
    updateParams({
      aiStatus: status === 'all' ? undefined : status,
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

  // Handle play recording
  const handlePlayRecording = async (callLogId: string): Promise<void> => {
    try {
      // Fetch the recording with authentication
      const response = await apiClient.get(`call-logs/${callLogId}/recording`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setPlayingRecording(url)
      setAudioDialogOpen(true)
    } catch (error) {
      toast.error(t('reports.playFailed', 'Failed to load recording'))
    }
  }

  // Handle download recording
  const handleDownloadRecording = async (callLogId: string): Promise<void> => {
    try {
      const response = await apiClient.get(`call-logs/${callLogId}/recording`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recording-${callLogId}.wav`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(
        t('reports.downloadSuccess', 'Recording downloaded successfully'),
      )
    } catch (error) {
      toast.error(t('reports.downloadFailed', 'Failed to download recording'))
    }
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

  const getSmsStatusBadge = (status: SmsStatus): React.ReactElement => {
    switch (status) {
      case SmsStatus.SENT:
        return (
          <Badge
            variant="outline"
            className="gap-1.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {t('reports.sent', 'Sent')}
          </Badge>
        )
      case SmsStatus.PENDING:
      case SmsStatus.SCHEDULED:
      case SmsStatus.SENDING:
        return (
          <Badge
            variant="outline"
            className="gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {t('reports.pending', 'Pending')}
          </Badge>
        )
      case SmsStatus.FAILED:
      case SmsStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="gap-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t('reports.failed', 'Failed')}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Pagination
  const totalPages =
    activeTab === 'voip'
      ? callLogsData?.meta.totalPages || 1
      : activeTab === 'sms'
        ? smsHistoryData?.meta.totalPages || 1
        : aiUsageData?.meta.totalPages || 1
  const currentPage = searchParams.page
  const totalItems =
    activeTab === 'voip'
      ? callLogsData?.meta.total || 0
      : activeTab === 'sms'
        ? smsHistoryData?.meta.total || 0
        : aiUsageData?.meta.total || 0
  const itemsPerPage = searchParams.limit

  // No services available
  const noServicesAvailable =
    !hasVoipService && !hasSmsService && !hasWhatsappService && !hasAiService

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="p-6 space-y-6">
        {noServicesAvailable ? (
          <>
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
          </>
        ) : (
          /* Tabs */
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {/* Header with Tabs */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('reports.title', 'Reports')}
              </h1>
              <TabsList className="bg-muted/100 rounded-lg p-1 h-auto w-auto justify-start gap-1">
                {hasVoipService && (
                  <TabsTrigger
                    value="voip"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    VoIP
                  </TabsTrigger>
                )}
                {hasSmsService && (
                  <TabsTrigger
                    value="sms"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    SMS
                  </TabsTrigger>
                )}
                {hasWhatsappService && (
                  <TabsTrigger
                    value="whatsapp"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    WhatsApp
                  </TabsTrigger>
                )}
                {hasAiService && (
                  <TabsTrigger
                    value="ai"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    AI
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

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

                      {/* Status Filter */}
                      <Popover
                        open={voipStatusOpen}
                        onOpenChange={setVoipStatusOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={voipStatusOpen}
                            className="w-[160px] justify-between"
                          >
                            {searchParams.disposition &&
                            searchParams.disposition !== 'all'
                              ? t(
                                  `reports.${searchParams.disposition.replace('_', '')}`,
                                  searchParams.disposition.replace('_', ' '),
                                )
                              : t('reports.allStatuses', 'All Statuses')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[160px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchStatus',
                                'Search status...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t('reports.noStatusFound', 'No status found.')}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleDispositionFilter('all')
                                    setVoipStatusOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.disposition ||
                                        searchParams.disposition === 'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allStatuses', 'All Statuses')}
                                </CommandItem>
                                {[
                                  'answered',
                                  'no_answer',
                                  'busy',
                                  'voicemail',
                                  'wrong_number',
                                  'callback_requested',
                                  'not_interested',
                                  'interested',
                                  'disconnected',
                                  'invalid_number',
                                  'failed',
                                ].map((status) => (
                                  <CommandItem
                                    key={status}
                                    value={status}
                                    onSelect={() => {
                                      handleDispositionFilter(status)
                                      setVoipStatusOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.disposition === status
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {t(
                                      `reports.${status.replace('_', '')}`,
                                      status.replace('_', ' '),
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('common.actions', 'ACTIONS')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingCallLogs ? (
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
                              {/* Actions */}
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">
                                        {t('common.actions', 'Actions')}
                                      </span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePlayRecording(log.id)
                                      }
                                    >
                                      <Play className="mr-2 h-4 w-4" />
                                      {t(
                                        'reports.playRecording',
                                        'Play Recording',
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownloadRecording(log.id)
                                      }
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {t(
                                        'reports.downloadRecording',
                                        'Download Recording',
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>

                  <StandardPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onExport={() => handleExport('voip')}
                    exportLabel={t('reports.exportReport', 'Export Report')}
                  />
                </div>

                {/* Audio Player Dialog */}
                <Dialog
                  open={audioDialogOpen}
                  onOpenChange={(open) => {
                    setAudioDialogOpen(open)
                    // Cleanup: revoke object URL when dialog closes
                    if (!open && playingRecording) {
                      window.URL.revokeObjectURL(playingRecording)
                      setPlayingRecording(null)
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {t('reports.playRecording', 'Play Recording')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-4">
                      {playingRecording && (
                        <audio
                          controls
                          autoPlay
                          className="w-full"
                          src={playingRecording}
                        >
                          <source src={playingRecording} type="audio/wav" />
                          {t(
                            'reports.audioNotSupported',
                            'Your browser does not support the audio element.',
                          )}
                        </audio>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            )}

            {/* SMS Reports Tab */}
            {hasSmsService && (
              <TabsContent value="sms" className="space-y-0 mt-0">
                {/* Filters Card */}
                <div className="rounded-t-lg border border-b-0 bg-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search Bar */}
                      <div className="relative w-full max-w-[160px]">
                        <Input
                          placeholder={t(
                            'reports.searchSms',
                            'Search by phone or message...',
                          )}
                          value={searchParams.search || ''}
                          onChange={(e) => {
                            updateParams({
                              search: e.target.value || undefined,
                              page: 1,
                            })
                          }}
                          className="pl-3"
                        />
                      </div>

                      {/* Start Date Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[130px] justify-start text-left font-normal"
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
                            className="w-[130px] justify-start text-left font-normal"
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
                            className="w-[140px] justify-between"
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

                      {/* Status Filter */}
                      {/* Status Filter */}
                      <Popover
                        open={smsStatusOpen}
                        onOpenChange={setSmsStatusOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={smsStatusOpen}
                            className="w-[130px] justify-between"
                          >
                            {searchParams.status &&
                            (searchParams.status as string) !== 'all'
                              ? t(
                                  `reports.${searchParams.status.toLowerCase()}`,
                                  searchParams.status,
                                )
                              : t('reports.allStatuses', 'All Statuses')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[130px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchStatus',
                                'Search status...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t('reports.noStatusFound', 'No status found.')}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleSmsStatusFilter('all')
                                    setSmsStatusOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.status ||
                                        (searchParams.status as string) ===
                                          'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allStatuses', 'All Statuses')}
                                </CommandItem>
                                {[
                                  SmsStatus.PENDING,
                                  SmsStatus.SCHEDULED,
                                  SmsStatus.SENDING,
                                  SmsStatus.SENT,
                                  SmsStatus.FAILED,
                                  SmsStatus.CANCELLED,
                                ].map((status) => (
                                  <CommandItem
                                    key={status}
                                    value={status}
                                    onSelect={() => {
                                      handleSmsStatusFilter(status)
                                      setSmsStatusOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.status === status
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {t(
                                      `reports.${status.toLowerCase()}`,
                                      status.charAt(0).toUpperCase() +
                                        status.slice(1).toLowerCase(),
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                          {t('reports.campaignName', 'CAMPAIGN NAME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.leadsName', 'LEADS NAME')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.operator', 'OPERATOR')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.phone', 'PHONE NUMBER')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.masking', 'MASKING')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.message', 'MESSAGE')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.smsToken', 'SMS TOKEN')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.status', 'STATUS')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.source', 'SOURCE')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingSmsHistory ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('common.loading', 'Loading...')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : smsHistoryData?.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <MessageSquare className="h-8 w-8" />
                              <p>
                                {t(
                                  'reports.noSmsHistory',
                                  'No SMS history found',
                                )}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        smsHistoryData?.data.map((sms) => {
                          const { date, time } = formatDateTime(sms.createdAt)
                          // Lookup campaign name properly
                          const campaignName =
                            campaigns.find((c) => c.id === sms.campaignId)
                              ?.name || '-'

                          return (
                            <TableRow
                              key={sms.id}
                              className="hover:bg-muted/30"
                            >
                              {/* Date & Time */}
                              <TableCell className="w-[140px]">
                                <div className="flex flex-col">
                                  <span className="font-medium">{date}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {time}
                                  </span>
                                </div>
                              </TableCell>
                              {/* Campaign Name */}
                              <TableCell>
                                <span className="font-medium">
                                  {campaignName}
                                </span>
                              </TableCell>
                              {/* Leads Name */}
                              <TableCell>
                                <span className="font-medium">
                                  {sms.lead?.lead?.leadName || '-'}
                                </span>
                              </TableCell>
                              {/* Operator */}
                              <TableCell>
                                <span className="font-medium">
                                  {sms.operatorName || '-'}
                                </span>
                              </TableCell>
                              {/* Phone Number */}
                              <TableCell>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {formatPhoneNumber(sms.phoneNumber)}
                                </span>
                              </TableCell>
                              {/* Masking */}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {sms.masking?.name || '-'}
                                </Badge>
                              </TableCell>
                              {/* Message (Multi-line) */}
                              <TableCell className="min-w-[300px] max-w-[500px]">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {sms.message}
                                </p>
                              </TableCell>
                              {/* SMS Token (Segment Count) */}
                              <TableCell className="w-[100px]">
                                <Badge variant="outline" className="font-mono">
                                  {sms.segmentCount}
                                </Badge>
                              </TableCell>
                              {/* Status */}
                              <TableCell className="w-[100px]">
                                {getSmsStatusBadge(sms.status)}
                              </TableCell>
                              {/* Source */}
                              <TableCell className="w-[100px]">
                                <span className="capitalize text-muted-foreground">
                                  {sms.source}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  <StandardPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    onExport={() => handleExport('sms')}
                    exportLabel={t('reports.exportReport', 'Export Report')}
                  />
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

            {/* AI Reports Tab */}
            {hasAiService && (
              <TabsContent value="ai" className="space-y-0 mt-0">
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

                      {/* Service Type Filter */}
                      {/* Service Type Filter */}
                      <Popover
                        open={aiServiceOpen}
                        onOpenChange={setAiServiceOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={aiServiceOpen}
                            className="w-[140px] justify-between"
                          >
                            {searchParams.aiServiceType &&
                            searchParams.aiServiceType !== 'all'
                              ? t(
                                  `services.${searchParams.aiServiceType}`,
                                  searchParams.aiServiceType
                                    .charAt(0)
                                    .toUpperCase() +
                                    searchParams.aiServiceType.slice(1),
                                )
                              : t('reports.allServices', 'All Services')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[140px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchService',
                                'Search service...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t(
                                  'reports.noServiceFound',
                                  'No service found.',
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleAiServiceTypeFilter('all')
                                    setAiServiceOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.aiServiceType ||
                                        searchParams.aiServiceType === 'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allServices', 'All Services')}
                                </CommandItem>
                                {['voice', 'sms', 'whatsapp'].map((service) => (
                                  <CommandItem
                                    key={service}
                                    value={service}
                                    onSelect={() => {
                                      handleAiServiceTypeFilter(service)
                                      setAiServiceOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.aiServiceType === service
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {t(
                                      `services.${service}`,
                                      service.charAt(0).toUpperCase() +
                                        service.slice(1),
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Status Filter */}
                      {/* Status Filter */}
                      <Popover
                        open={aiStatusOpen}
                        onOpenChange={setAiStatusOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={aiStatusOpen}
                            className="w-[140px] justify-between"
                          >
                            {searchParams.aiStatus &&
                            searchParams.aiStatus !== 'all'
                              ? t(
                                  `reports.${searchParams.aiStatus}`,
                                  searchParams.aiStatus
                                    .charAt(0)
                                    .toUpperCase() +
                                    searchParams.aiStatus.slice(1),
                                )
                              : t('reports.allStatus', 'All Status')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[140px] p-0">
                          <Command>
                            <CommandInput
                              placeholder={t(
                                'reports.searchStatus',
                                'Search status...',
                              )}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {t('reports.noStatusFound', 'No status found.')}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleAiStatusFilter('all')
                                    setAiStatusOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      !searchParams.aiStatus ||
                                        searchParams.aiStatus === 'all'
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {t('reports.allStatus', 'All Status')}
                                </CommandItem>
                                {['success', 'failed'].map((status) => (
                                  <CommandItem
                                    key={status}
                                    value={status}
                                    onSelect={() => {
                                      handleAiStatusFilter(status)
                                      setAiStatusOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        searchParams.aiStatus === status
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {t(
                                      `reports.${status}`,
                                      status.charAt(0).toUpperCase() +
                                        status.slice(1),
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                          {t('reports.service', 'SERVICE')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.model', 'MODEL')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.promptInput', 'PROMPT / INPUT')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.tokens', 'TOKENS')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.cost', 'COST')}
                        </TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {t('reports.status', 'STATUS')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAiUsage ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('common.loading', 'Loading...')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : aiUsageData?.records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <BrainCircuit className="h-8 w-8" />
                              <p>{t('reports.noAiLogs', 'No AI logs found')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        aiUsageData?.records.map((log) => {
                          const { date, time } = formatDateTime(log.createdAt)
                          return (
                            <TableRow
                              key={log.id}
                              className="hover:bg-muted/30"
                            >
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{date}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {time}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {log.serviceType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {log.model.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {log.model.provider.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <div
                                  className="truncate text-sm"
                                  title={log.prompt || log.referenceType}
                                >
                                  {log.prompt || (
                                    <span className="text-muted-foreground italic">
                                      {log.referenceType}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col text-xs">
                                  <span>
                                    In: {log.inputTokens.toLocaleString()}
                                  </span>
                                  <span>
                                    Out: {log.outputTokens.toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-orange-600">
                                ${log.costAmount}
                              </TableCell>
                              <TableCell>
                                {log.status === 'success' ? (
                                  <Badge
                                    variant="outline"
                                    className="gap-1.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    {t('reports.success', 'Success')}
                                  </Badge>
                                ) : (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="gap-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 cursor-help"
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        {t('reports.failed', 'Failed')}
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="flex gap-2">
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium leading-none">
                                            {t(
                                              'reports.errorDetail',
                                              'Error Details',
                                            )}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {log.errorMessage ||
                                              t(
                                                'common.unknownError',
                                                'Unknown error',
                                              )}
                                          </p>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  <StandardPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    onExport={() => handleExport('ai')}
                    exportLabel={t('reports.exportReport', 'Export Report')}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </RoleGuard>
  )
}
