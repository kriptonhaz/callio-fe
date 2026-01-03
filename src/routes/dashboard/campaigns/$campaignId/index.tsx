import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import { useCampaign, useUpdateCampaign } from '@/hooks/api/useCampaigns'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useBulkImportLeads } from '@/hooks/api/useLeads'
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
  ArrowLeft,
  Calendar,
  Users,
  Plus,
  Upload,
  Edit,
  Loader2,
  Download,
  UserPlus,
  MessageSquare,
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

  // Fetch SMS masking - superadmin needs to pass clientId, others use JWT
  const { data: smsMaskingData } = useSmsMasking(
    isSuperadmin ? clientId : undefined,
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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddLeadSheetOpen, setIsAddLeadSheetOpen] = useState(false)
  const [isAddExistingDialogOpen, setIsAddExistingDialogOpen] = useState(false)
  const [isComposeSmsSheetOpen, setIsComposeSmsSheetOpen] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkUnassignDialogOpen, setBulkUnassignDialogOpen] = useState(false)

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
            `Successfully imported ${data.imported} leads. ${data.skipped > 0 ? `${data.skipped} duplicates skipped.` : ''}`,
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

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
        <div className="p-6 space-y-6">
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/campaigns" search={{ page: 1, limit: 10 }}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {campaign.name}
                </h1>
                {getStatusBadge(campaign.status)}
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit', 'Edit')}
            </Button>
          )}
        </div>

        {/* Campaign Details Card - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('campaigns.details', 'Campaign Details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            {campaign.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('campaigns.description', 'Description')}
                </p>
                <p className="text-base">{campaign.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('campaigns.startDate', 'Start Date')}
                </p>
                <p className="font-medium">{formatDate(campaign.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('campaigns.endDate', 'End Date')}
                </p>
                <p className="font-medium">{formatDate(campaign.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('common.createdAt', 'Created At')}
                </p>
                <p className="font-medium">{formatDate(campaign.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('common.updatedAt', 'Updated At')}
                </p>
                <p className="font-medium">{formatDate(campaign.updatedAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                  <p className="text-sm text-muted-foreground">
                    {t('campaigns.createdBy', 'Created By')}
                  </p>
                  <p className="font-medium">{campaign.creator.name}</p>
                  {campaign.creator.email && (
                    <p className="text-sm text-muted-foreground">
                      {campaign.creator.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads Section - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('campaigns.leads', 'Leads')}
                </CardTitle>
                <CardDescription>
                  {t('campaigns.leadsCount', '{{count}} leads assigned', {
                    count: campaign._count?.leadAssignments || 0,
                  })}
                </CardDescription>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  {/* Compose SMS Button - Only show if campaign has SMS service */}
                  {campaign.campaignServices?.some(
                    (s) => s.serviceType === ServiceType.SMS,
                  ) && (
                    <Button
                      size="sm"
                      onClick={() => setIsComposeSmsSheetOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!campaign._count?.leadAssignments}
                      title={
                        !campaign._count?.leadAssignments
                          ? t(
                              'campaigns.noLeadsToSendSms',
                              'No leads in this campaign',
                            )
                          : undefined
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t('campaigns.composeSms', 'Compose SMS')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSample}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('campaigns.downloadSample', 'Download Sample')}
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
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddExistingDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('campaigns.addExisting', 'Add from Existing')}
                  </Button>
                  <Button size="sm" onClick={() => setIsAddLeadSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('campaigns.addLead', 'Add Lead')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CampaignLeadsTable
              campaignId={campaignId}
              clientId={clientId || ''}
              campaignServices={campaign.campaignServices}
              selectedLeadIds={selectedLeadIds}
              onSelectedLeadsChange={setSelectedLeadIds}
              onBulkUnassignClick={() => setBulkUnassignDialogOpen(true)}
            />
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
                                    {service.serviceType === 'voice' &&
                                      t('services.voice', 'VoIP')}
                                    {service.serviceType === 'sms' &&
                                      t('services.sms', 'SMS')}
                                    {service.serviceType === 'whatsapp' &&
                                      t('services.whatsapp', 'WhatsApp')}
                                    {service.serviceType === 'ai' &&
                                      t('services.ai', 'AI')}
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
    </RoleGuard>
  )
}
