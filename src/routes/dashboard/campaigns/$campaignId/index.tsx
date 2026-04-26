import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/hooks/api/useCampaigns'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useBulkImportLeads } from '@/hooks/api/useLeads'
import { useHeaderStore } from '@/store/useHeaderStore'
import {
  useLeadAssignments,
  useBulkUnassignLeads,
} from '@/hooks/api/useLeadAssignments'
import { useSmsMasking } from '@/hooks/api/useIpWhitelist'
import { CampaignStatus } from '@/lib/api/types'
import { ServiceType } from '@/lib/api/types/services.types'
import type { UpdateCampaignRequest } from '@/lib/api/types/campaigns.types'
import { AddLeadSheet } from '@/components/campaigns/AddLeadSheet'
import { CampaignLeadsTable } from '@/components/campaigns/CampaignLeadsTable'
import { AddExistingLeadsDialog } from '@/components/campaigns/AddExistingLeadsDialog'
import { ComposeSmsSheet } from '@/components/campaigns/ComposeSmsSheet'
import { BlastWhatsAppSheet } from '@/components/campaigns/BlastWhatsAppSheet'
import { EmailBlastSheet } from '@/components/email/EmailBlastSheet'
import { EmailBlastJobBanner } from '@/components/email/EmailBlastJobBanner'
import { AutoDistributeDialog } from '@/components/campaigns/AutoDistributeDialog'
import { WorkMode } from '@/components/campaigns/WorkMode'
import { CampaignLayoutView } from '@/components/campaigns/CampaignLayoutView'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import sampleCsvUrl from '@/assets/data/sample-leads-import.csv?url'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  ArrowLeft,
  Calendar,
  Users,
  Plus,
  Upload,
  Edit,
  Trash,
  Loader2,
  Download,
  UserPlus,
  MessageSquare,
  Send,
  Folder,
  Mail,
  Megaphone,
  ChevronDown,
  Shuffle,
  List,
  UserCheck,
  LayoutPanelTop,
} from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import type { CampaignStatus as CampaignStatusType } from '@/lib/api/types'

const campaignFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  status: z.nativeEnum(CampaignStatus),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  serviceTypes: z
    .array(z.nativeEnum(ServiceType))
    .min(1, 'Select at least one service'),
})

type CampaignFormValues = z.infer<typeof campaignFormSchema>

export const Route = createFileRoute('/dashboard/campaigns/$campaignId/')({
  component: CampaignDetailPage,
})

function CampaignDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { campaignId } = Route.useParams()

  const { data: me } = useMe()
  const clientId = me?.clientId
  const userRole = me?.role
  const isSuperadmin = userRole === 'superadmin'
  const isAdmin = userRole === 'admin'

  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const { data: enabledServices, isLoading: isLoadingServices } =
    useEnabledServices(clientId)
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutate: bulkImport, isPending: isImporting } = useBulkImportLeads()
  const { mutate: bulkUnassignLeads, isPending: isBulkUnassigning } =
    useBulkUnassignLeads()
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign()

  // Fetch SMS masking - only for admin or superadmin
  const canAccessSmsMasking = isSuperadmin || isAdmin
  const { data: smsMaskingData } = useSmsMasking(
    isSuperadmin ? clientId : undefined,
    canAccessSmsMasking, // Only enable query for admin/superadmin
  )
  const activeMaskingList =
    smsMaskingData?.data?.filter((m) => m.isActive) || []
  const maskingOptions = activeMaskingList.map((m) => ({
    id: m.id,
    name: m.name,
  }))

  // Determine default masking ID: if only 1 option, use it; otherwise find isPrimary
  const getDefaultMaskingId = (): string => {
    if (activeMaskingList.length === 1) {
      return activeMaskingList[0].id
    }
    const primaryMasking = activeMaskingList.find(
      (m) => m.clientMaskings?.[0]?.isPrimary,
    )
    return primaryMasking?.id || ''
  }
  const defaultMaskingId = getDefaultMaskingId()

  // Fetch lead assignments for SMS compose
  const { data: leadAssignmentsData } = useLeadAssignments({
    campaignId,
    page: 1,
    limit: 100,
  })

  const allLeadAssignments =
    leadAssignmentsData?.data?.map((la) => ({
      id: la.id,
      name: la.lead?.leadName || 'Unknown',
      phone: la.lead?.phone || '',
    })) || []

  const setCustomContent = useHeaderStore((state) => state.setCustomContent)
  const resetCustomContent = useHeaderStore((state) => state.resetCustomContent)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddLeadSheetOpen, setIsAddLeadSheetOpen] = useState(false)
  const [isAddExistingDialogOpen, setIsAddExistingDialogOpen] = useState(false)
  const [isComposeSmsSheetOpen, setIsComposeSmsSheetOpen] = useState(false)
  const [isBlastWhatsAppSheetOpen, setIsBlastWhatsAppSheetOpen] =
    useState(false)
  const [isEmailBlastSheetOpen, setIsEmailBlastSheetOpen] = useState(false)
  const [activeEmailBlastJobId, setActiveEmailBlastJobId] = useState<
    string | null
  >(null)
  const [isAutoDistributeOpen, setIsAutoDistributeOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'work'>('list')
  const [workModeIndex, setWorkModeIndex] = useState(1)
  const isAgent = userRole === 'agent'
  const [batchDate, setBatchDate] = useState(
    new Date().toISOString().split('T')[0],
  )

  // Fetch actual leads count visible to current user (matching active batch date filter)
  const { data: visibleLeadsData } = useLeadAssignments({
    campaignId,
    batchDate: !isAgent && batchDate ? batchDate : undefined,
    page: 1,
    limit: 1,
  })
  const visibleLeadsCount = visibleLeadsData?.meta?.total ?? 0

  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true)
  const [hasSetDefaults, setHasSetDefaults] = useState(false)

  useEffect(() => {
    if (userRole && !hasSetDefaults) {
      if (userRole === 'agent') {
        setViewMode('work')
        setIsDetailsExpanded(false)
      }
      setHasSetDefaults(true)
    }
  }, [userRole, hasSetDefaults])
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkUnassignDialogOpen, setBulkUnassignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: CampaignStatus.ACTIVE,
      startDate: '',
      endDate: '',
      serviceTypes: [],
    },
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: CampaignStatusType) => {
    const statusConfig = {
      active: {
        className:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        label: t('campaigns.status.active', 'Active'),
      },
      paused: {
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: t('campaigns.status.paused', 'Paused'),
      },
      completed: {
        className:
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        label: t('campaigns.status.completed', 'Completed'),
      },
    }

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.completed

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getServiceBadge = (serviceType: string) => {
    const serviceConfig: Record<string, { className: string; label: string }> =
      {
        voice: {
          className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          label: t('services.voice', 'VoIP'),
        },
        sms: {
          className:
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          label: t('services.sms', 'SMS'),
        },
        whatsapp: {
          className:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          label: t('services.whatsapp', 'WhatsApp'),
        },
        ai: {
          className:
            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          label: t('services.ai', 'AI'),
        },
        email: {
          className:
            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          label: t('services.email', 'Email'),
        },
      }

    const config = serviceConfig[serviceType] || {
      className: 'bg-gray-100 text-gray-800',
      label: serviceType,
    }

    return (
      <Badge key={serviceType} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const openEditDialog = () => {
    if (!campaign) return
    const serviceTypes =
      campaign.campaignServices?.map((s) => s.serviceType) || []
    form.reset({
      name: campaign.name,
      description: campaign.description || '',
      status: campaign.status,
      startDate: formatDateForInput(campaign.startDate),
      endDate: formatDateForInput(campaign.endDate),
      serviceTypes,
    })
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    form.reset()
  }

  const onSubmit = (data: CampaignFormValues) => {
    const payload: UpdateCampaignRequest = {
      ...data,
      serviceTypes: data.serviceTypes,
    }

    updateCampaign(
      { id: campaignId, data: payload },
      {
        onSuccess: () => {
          toast.success(t('campaigns.updated', 'Campaign updated successfully'))
          closeEditDialog()
        },
        onError: () => {
          toast.error(t('campaigns.updateFailed', 'Failed to update campaign'))
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (campaign) {
      deleteCampaign(campaign.id, {
        onSuccess: () => {
          toast.success(t('campaigns.deleted', 'Campaign deleted successfully'))
          setIsDeleteDialogOpen(false)
          navigate({
            to: '/dashboard/campaigns',
            search: { page: 1, limit: 10 },
          })
        },
        onError: () => {
          toast.error(t('campaigns.deleteFailed', 'Failed to delete campaign'))
        },
      })
    }
  }

  const handleDownloadSample = () => {
    // Use local CSV file instead of API endpoint
    const link = document.createElement('a')
    link.href = sampleCsvUrl
    link.download = 'sample-leads-import.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t('campaigns.sampleDownloaded', 'Sample CSV downloaded'))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error(
        t(
          'campaigns.invalidFileType',
          'Invalid file type. Only CSV files are allowed.',
        ),
      )
      event.target.value = ''
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(
        t(
          'campaigns.fileTooLarge',
          'File size exceeds 5MB limit. Please choose a smaller file.',
        ),
      )
      event.target.value = ''
      return
    }

    // Create FormData and submit
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId!)
    formData.append('campaignIds', campaignId)

    bulkImport(formData, {
      onSuccess: (data) => {
        toast.success(
          t(
            'campaigns.importSuccess',
            `Imported ${data.created + data.reused} leads: ${data.created} new, ${data.reused} existing. All assigned to campaign.`,
          ),
        )
        event.target.value = ''
      },
      onError: () => {
        toast.error(
          t('campaigns.importFailed', 'Failed to import leads from CSV.'),
        )
        event.target.value = ''
      },
    })
  }

  const handleBulkUnassign = () => {
    if (selectedLeadIds.length === 0) return

    bulkUnassignLeads(
      { campaignId, leadIds: selectedLeadIds },
      {
        onSuccess: (result) => {
          if (result.failed > 0) {
            toast.warning(
              t(
                'campaigns.bulkUnassignPartial',
                `Unassigned ${result.unassigned} lead(s). ${result.failed} failed.`,
              ),
            )
          } else {
            toast.success(
              t(
                'campaigns.bulkUnassignSuccess',
                `Successfully unassigned ${result.unassigned} lead(s)`,
              ),
            )
          }
          setSelectedLeadIds([])
          setBulkUnassignDialogOpen(false)
        },
        onError: () => {
          toast.error(
            t('campaigns.bulkUnassignFailed', 'Failed to unassign leads'),
          )
        },
      },
    )
  }

  // Update header content
  useEffect(() => {
    if (campaign) {
      setCustomContent(
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/dashboard/campaigns" search={{ page: 1, limit: 10 }}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3 overflow-hidden">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate max-w-[200px] md:max-w-none">
              {campaign.name}
            </h1>
          </div>
        </div>,
      )
    }

    return () => {
      resetCustomContent()
    }
  }, [campaign, setCustomContent, resetCustomContent])

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </RoleGuard>
    )
  }

  if (error || !campaign) {
    return (
      <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {t('campaigns.notFound', 'Campaign not found')}
              </p>
              <Button asChild className="mt-4">
                <Link to="/dashboard/campaigns" search={{ page: 1, limit: 10 }}>
                  {t('common.backToList', 'Back to List')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
      <div className="space-y-4 md:space-y-6">
        {/* Header content moved to global Header */}

        {activeEmailBlastJobId && (
          <EmailBlastJobBanner
            jobId={activeEmailBlastJobId}
            onDismiss={() => setActiveEmailBlastJobId(null)}
          />
        )}

        {/* Campaign Details Card - Redesigned */}

        {/* Campaign Details Card - Redesigned */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('campaigns.details', 'Campaign Details')}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => setIsDetailsExpanded((prev) => !prev)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDetailsExpanded ? '' : '-rotate-90'
                    }`}
                  />
                </Button>
              </CardTitle>
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openEditDialog}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit', 'Edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      {t('common.delete', 'Delete')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          {isDetailsExpanded && (
          <CardContent className="space-y-6">
            {/* Action Buttons - Only visible on mobile */}
            <div className="flex gap-4 md:hidden">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={openEditDialog}
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    {t('common.edit', 'Edit')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash className="h-5 w-5 mr-2" />
                    {t('common.delete', 'Delete')}
                  </Button>
                </>
              )}
            </div>

            <div className="h-px bg-border md:hidden" />

            {/* Description */}
            {campaign.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('campaigns.description', 'Description')}
                </p>
                <p className="text-base">{campaign.description}</p>
              </div>
            )}

            {/* Dates Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('campaigns.startDate', 'Start Date')}
                </p>
                <p className="font-semibold text-lg">
                  {formatDate(campaign.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('campaigns.endDate', 'End Date')}
                </p>
                <p className="font-semibold text-lg">
                  {formatDate(campaign.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('common.createdAt', 'Created At')}
                </p>
                <p className="font-semibold text-lg">
                  {formatDate(campaign.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('common.updatedAt', 'Updated At')}
                </p>
                <p className="font-semibold text-lg">
                  {formatDate(campaign.updatedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('common.status', 'Status')}
                </p>
                <div>{getStatusBadge(campaign.status)}</div>
              </div>
            </div>

            {/* Services and Creator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('campaigns.services', 'Services')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {campaign.campaignServices &&
                  campaign.campaignServices.length > 0 ? (
                    campaign.campaignServices.map((s) =>
                      getServiceBadge(s.serviceType),
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </div>
              {campaign.creator && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('campaigns.createdBy', 'Created By')}
                  </p>
                  <p className="font-semibold">{campaign.creator.name}</p>
                  {campaign.creator.email && (
                    <p className="text-sm text-muted-foreground">
                      {campaign.creator.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          )}
        </Card>

        {/* Campaign Settings — admin only */}
        {isAdmin && (
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutPanelTop className="h-5 w-5" />
                      <CardTitle>
                        {t('campaigns.settings', 'Campaign Settings')}
                      </CardTitle>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                  </div>
                  <CardDescription>
                    {t(
                      'campaigns.settingsDesc',
                      'Configure how Work Mode looks for agents on this campaign.',
                    )}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <CampaignLayoutView campaignId={campaignId} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Leads Section - Full Width */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3">
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                {t('campaigns.leads', 'Leads')}
                <span className="text-sm font-normal text-muted-foreground">
                  {t('campaigns.leadsCount', '{{count}} leads assigned', {
                    count: visibleLeadsCount,
                  })}
                </span>
              </CardTitle>
              <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-3.5 w-3.5 mr-1" />
                      {t('campaigns.listView', 'List')}
                    </Button>
                    <Button
                      variant={viewMode === 'work' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setViewMode('work')}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      {t('campaigns.workMode', 'Work Mode')}
                    </Button>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                  {/* Blast Action — single dropdown gating SMS / WhatsApp /
                      Email by which services are activated on this campaign. */}
                  {(() => {
                    const hasSms = !!campaign.campaignServices?.some(
                      (s) => s.serviceType === ServiceType.SMS,
                    )
                    const hasWhatsApp = !!campaign.campaignServices?.some(
                      (s) => s.serviceType === ServiceType.WHATSAPP,
                    )
                    const hasEmail = !!campaign.campaignServices?.some(
                      (s) => s.serviceType === ServiceType.EMAIL,
                    )
                    const hasAnyChannel = hasSms || hasWhatsApp || hasEmail
                    if (!hasAnyChannel) return null
                    const noLeads = !campaign._count?.leadAssignments
                    const noLeadsLabel = t(
                      'campaigns.noLeadsToBlast',
                      'No leads in this campaign',
                    )
                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none gap-2"
                            disabled={noLeads}
                            title={noLeads ? noLeadsLabel : undefined}
                          >
                            <Megaphone className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {t(
                                'campaigns.blastAction',
                                'Blast Action',
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isAdmin && hasSms && (
                            <DropdownMenuItem
                              onClick={() => setIsComposeSmsSheetOpen(true)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                              {t('campaigns.composeSms', 'Compose SMS')}
                            </DropdownMenuItem>
                          )}
                          {hasWhatsApp && (
                            <DropdownMenuItem
                              onClick={() =>
                                setIsBlastWhatsAppSheetOpen(true)
                              }
                            >
                              <Send className="h-4 w-4 mr-2 text-emerald-600" />
                              {t(
                                'campaigns.whatsappBlast',
                                'Whatsapp Blast',
                              )}
                            </DropdownMenuItem>
                          )}
                          {isAdmin && hasEmail && (
                            <DropdownMenuItem
                              onClick={() => setIsEmailBlastSheetOpen(true)}
                            >
                              <Mail className="h-4 w-4 mr-2 text-orange-600" />
                              {t('campaigns.emailBlast', 'Email Blast')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  })()}
                  {isAdmin && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                          >
                            <Folder className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              {t('campaigns.bulkActions', 'Bulk Actions')}
                            </span>
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleDownloadSample}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('campaigns.downloadSample', 'Download Sample')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              document.getElementById('csv-upload')?.click()
                            }
                            disabled={isImporting}
                          >
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {t('campaigns.import', 'Import')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setIsAddExistingDialogOpen(true)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('campaigns.addExisting', 'Add from Existing')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        id="csv-upload"
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAutoDistributeOpen(true)}
                        className="flex-1 sm:flex-none"
                        disabled={!campaign._count?.leadAssignments}
                        title={
                          !campaign._count?.leadAssignments
                            ? t(
                                'campaigns.noLeadsToDistribute',
                                'No leads in this campaign',
                              )
                            : undefined
                        }
                      >
                        <Shuffle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('campaigns.autoDistribute', 'Auto Distribute')}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setIsAddLeadSheetOpen(true)}
                        className="flex-1 sm:flex-none"
                      >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('campaigns.addLead', 'Add Lead')}
                        </span>
                      </Button>
                    </>
                  )}
                  </div>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? (
              <CampaignLeadsTable
                campaignId={campaignId}
                clientId={clientId || ''}
                campaignServices={campaign.campaignServices}
                selectedLeadIds={selectedLeadIds}
                onSelectedLeadsChange={setSelectedLeadIds}
                onBulkUnassignClick={() => setBulkUnassignDialogOpen(true)}
                batchDate={batchDate}
                onBatchDateChange={setBatchDate}
              />
            ) : (
              <WorkMode
                campaignId={campaignId}
                clientId={clientId || ''}
                campaignServices={campaign.campaignServices}
                currentIndex={workModeIndex}
                onIndexChange={setWorkModeIndex}
                batchDate={!isAgent ? batchDate : undefined}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => !open && closeEditDialog()}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {t('campaigns.editCampaign', 'Edit Campaign')}
              </DialogTitle>
              <DialogDescription>
                {t('campaigns.editDescription', 'Update campaign details.')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('campaigns.name', 'Name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'campaigns.namePlaceholder',
                            'Campaign name',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('campaigns.description', 'Description')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            'campaigns.descriptionPlaceholder',
                            'Campaign description',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status', 'Status')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'campaigns.selectStatus',
                                'Select status',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            {t('campaigns.status.active', 'Active')}
                          </SelectItem>
                          <SelectItem value="paused">
                            {t('campaigns.status.paused', 'Paused')}
                          </SelectItem>
                          <SelectItem value="completed">
                            {t('campaigns.status.completed', 'Completed')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('campaigns.startDate', 'Start Date')}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('campaigns.endDate', 'End Date')}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Service Types */}
                <FormField
                  control={form.control}
                  name="serviceTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        {t('campaigns.services', 'Services')}
                      </FormLabel>
                      <div className="space-y-2">
                        {isLoadingServices ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('common.loading', 'Loading...')}
                          </div>
                        ) : enabledServices && enabledServices.length > 0 ? (
                          enabledServices.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="serviceTypes"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        service.serviceType as ServiceType,
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || []
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            service.serviceType as ServiceType,
                                          ])
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (v) => v !== service.serviceType,
                                            ),
                                          )
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {(() => {
                                      const slug = String(
                                        service.serviceType ?? '',
                                      )
                                        .toLowerCase()
                                        .trim()
                                      if (slug === 'voice')
                                        return t('services.voice', 'VoIP')
                                      if (slug === 'sms')
                                        return t('services.sms', 'SMS')
                                      if (slug === 'whatsapp')
                                        return t(
                                          'services.whatsapp',
                                          'WhatsApp',
                                        )
                                      if (slug === 'ai')
                                        return t('services.ai', 'AI')
                                      if (slug === 'email')
                                        return t('services.email', 'Email')
                                      return slug
                                    })()}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t(
                              'campaigns.noServicesEnabled',
                              'No services enabled for this client.',
                            )}
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('common.save', 'Save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditDialog}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Lead Sheet */}
        {clientId && (
          <AddLeadSheet
            open={isAddLeadSheetOpen}
            onOpenChange={setIsAddLeadSheetOpen}
            clientId={clientId}
            campaignId={campaignId}
          />
        )}
        <AddExistingLeadsDialog
          open={isAddExistingDialogOpen}
          onOpenChange={setIsAddExistingDialogOpen}
          campaignId={campaignId}
          clientId={clientId!}
        />

        {/* Compose SMS Sheet */}
        <ComposeSmsSheet
          open={isComposeSmsSheetOpen}
          onOpenChange={setIsComposeSmsSheetOpen}
          campaignId={campaignId}
          maskingOptions={maskingOptions}
          defaultMaskingId={defaultMaskingId}
          allLeadAssignments={allLeadAssignments}
        />

        <BlastWhatsAppSheet
          open={isBlastWhatsAppSheetOpen}
          onOpenChange={setIsBlastWhatsAppSheetOpen}
          campaignId={campaignId}
          allLeadAssignments={allLeadAssignments}
        />

        <EmailBlastSheet
          open={isEmailBlastSheetOpen}
          onOpenChange={setIsEmailBlastSheetOpen}
          campaignId={campaignId}
          onJobCreated={(jobId) => setActiveEmailBlastJobId(jobId)}
        />

        <AutoDistributeDialog
          open={isAutoDistributeOpen}
          onOpenChange={setIsAutoDistributeOpen}
          campaignId={campaignId}
          clientId={clientId || ''}
        />
      </div>

      {/* Bulk Unassign Confirmation Dialog */}
      <AlertDialog
        open={bulkUnassignDialogOpen}
        onOpenChange={setBulkUnassignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                'campaigns.confirmBulkUnassignTitle',
                'Unassign selected leads?',
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'campaigns.confirmBulkUnassignDescription',
                'Are you sure you want to unassign {{count}} lead(s) from this campaign? The leads will remain in your leads list.',
                { count: selectedLeadIds.length },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUnassigning}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkUnassign}
              disabled={isBulkUnassigning}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkUnassigning && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('campaigns.unassign', 'Unassign')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.confirmDelete', 'Confirm Delete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'campaigns.deleteConfirmation',
                'Are you sure you want to delete this campaign? This action cannot be undone.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}
