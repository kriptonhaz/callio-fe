import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/hooks/api/useCampaigns'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { CampaignStatus } from '@/lib/api/types'
import { ServiceType } from '@/lib/api/types/services.types'
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@/lib/api/types/campaigns.types'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Search,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { format } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

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

interface CampaignsSearch {
  page: number
  limit: number
  search?: string
  status?: CampaignStatus
}

export const Route = createFileRoute('/dashboard/campaigns/')({
  component: CampaignsPage,
  validateSearch: (search: Record<string, unknown>): CampaignsSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
      search: (search.search as string) || undefined,
      status: (search.status as CampaignStatus) || undefined,
    }
  },
})

function CampaignsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const [searchValue, setSearchValue] = useState(searchParams.search || '')
  const debouncedSearch = useDebounce(searchValue, 500)

  // Auth context
  const { data: me } = useMe()
  const clientId = me?.clientId
  const userRole = me?.role
  const isAdmin = userRole === 'admin'

  // Dialog states
  const [currentAction, setCurrentAction] = useState<
    'create' | 'edit' | 'view' | 'delete' | null
  >(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  )

  // API hooks
  const { data: campaignsData, isLoading } = useCampaigns({
    clientId,
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
    status: searchParams.status,
  })

  const { data: enabledServices, isLoading: isLoadingServices } =
    useEnabledServices(clientId)

  const { mutate: createCampaign, isPending: isCreating } = useCreateCampaign()
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign()

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

  // Navigation helpers
  const updateParams = (updates: Partial<CampaignsSearch>) => {
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

  const handleStatusFilter = (status: string) => {
    updateParams({
      status: status === 'all' ? undefined : (status as CampaignStatus),
      page: 1,
    })
  }

  // Dialog handlers
  const closeDialog = () => {
    setCurrentAction(null)
    setSelectedCampaign(null)
    form.reset()
  }

  const openCreateDialog = () => {
    setCurrentAction('create')
    form.reset({
      name: '',
      description: '',
      status: CampaignStatus.ACTIVE,
      startDate: '',
      endDate: '',
      serviceTypes: [],
    })
  }

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setCurrentAction('edit')
    // Extract service types from campaignServices array
    const serviceTypes =
      campaign.campaignServices?.map((s) => s.serviceType) || []
    // Format dates for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateStr?: string) => {
      if (!dateStr) return ''
      try {
        return new Date(dateStr).toISOString().split('T')[0]
      } catch {
        return ''
      }
    }
    form.reset({
      name: campaign.name,
      description: campaign.description || '',
      status: campaign.status,
      startDate: formatDateForInput(campaign.startDate),
      endDate: formatDateForInput(campaign.endDate),
      serviceTypes,
    })
  }

  const openDeleteDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setCurrentAction('delete')
  }

  const onSubmit = (data: CampaignFormValues) => {
    if (currentAction === 'create') {
      const payload: CreateCampaignRequest = {
        ...data,
        clientId: clientId!,
        serviceTypes: data.serviceTypes,
      }

      createCampaign(payload, {
        onSuccess: () => {
          toast.success(t('campaigns.created', 'Campaign created successfully'))
          closeDialog()
        },
        onError: () => {
          toast.error(t('campaigns.createFailed', 'Failed to create campaign'))
        },
      })
    } else if (currentAction === 'edit' && selectedCampaign) {
      const payload: UpdateCampaignRequest = {
        ...data,
      }

      updateCampaign(
        { id: selectedCampaign.id, data: payload },
        {
          onSuccess: () => {
            toast.success(
              t('campaigns.updated', 'Campaign updated successfully'),
            )
            closeDialog()
          },
          onError: () => {
            toast.error(
              t('campaigns.updateFailed', 'Failed to update campaign'),
            )
          },
        },
      )
    }
  }

  const handleConfirmDelete = () => {
    if (selectedCampaign) {
      deleteCampaign(selectedCampaign.id, {
        onSuccess: () => {
          toast.success(t('campaigns.deleted', 'Campaign deleted successfully'))
          closeDialog()
        },
        onError: () => {
          toast.error(t('campaigns.deleteFailed', 'Failed to delete campaign'))
        },
      })
    }
  }

  // UI Helpers
  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig = {
      active: {
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      paused: {
        variant: 'secondary' as const,
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      completed: {
        variant: 'outline' as const,
        className:
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      },
    }

    const config = statusConfig[status] || statusConfig.completed

    return <Badge className={config.className}>{status.toUpperCase()}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const getServiceBadge = (serviceType: string) => {
    const serviceConfig: Record<string, { className: string; label: string }> =
      {
        voice: {
          className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          label: 'VoIP',
        },
        sms: {
          className:
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          label: 'SMS',
        },
        whatsapp: {
          className:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          label: 'WhatsApp',
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

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('campaigns.title', 'Campaigns')}
          </h1>
          {isAdmin && (
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {t('campaigns.addCampaign', 'Add Campaign')}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('campaigns.list', 'Campaign List')}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t(
                      'campaigns.searchPlaceholder',
                      'Search campaigns...',
                    )}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={searchParams.status || 'all'}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue
                      placeholder={t('campaigns.filterStatus', 'Filter status')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('common.all', 'All')}
                    </SelectItem>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <TableRow>
                    <TableHead className="font-semibold text-primary">
                      {t('campaigns.name', 'Name')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('campaigns.services', 'Services')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('common.status', 'Status')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('campaigns.startDate', 'Start Date')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('campaigns.endDate', 'End Date')}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-primary">
                      {t('common.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('common.loading', 'Loading...')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : campaignsData?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t('campaigns.noCampaigns', 'No campaigns found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaignsData?.data.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {campaign.campaignServices &&
                            campaign.campaignServices.length > 0 ? (
                              campaign.campaignServices.map((s) =>
                                getServiceBadge(s.serviceType),
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{formatDate(campaign.startDate)}</TableCell>
                        <TableCell>{formatDate(campaign.endDate)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {t('common.actions', 'Actions')}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate({
                                    to: `/dashboard/campaigns/${campaign.id}` as any,
                                  })
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view', 'View')}
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(campaign)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('common.edit', 'Edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(campaign)}
                                    className="text-red-600"
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {t('common.delete', 'Delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {campaignsData && campaignsData.meta.totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchParams.page - 1)}
                  disabled={searchParams.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous', 'Previous')}
                </Button>
                <div className="text-sm font-medium">
                  {t('common.pageOf', 'Page {{current}} of {{total}}', {
                    current: searchParams.page,
                    total: campaignsData.meta.totalPages,
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchParams.page + 1)}
                  disabled={searchParams.page >= campaignsData.meta.totalPages}
                >
                  {t('common.next', 'Next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit/View Dialog */}
        <Dialog
          open={!!currentAction && currentAction !== 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {currentAction === 'create' &&
                  t('campaigns.addCampaign', 'Add Campaign')}
                {currentAction === 'edit' &&
                  t('campaigns.editCampaign', 'Edit Campaign')}
                {currentAction === 'view' &&
                  t('campaigns.viewCampaign', 'View Campaign')}
              </DialogTitle>
              <DialogDescription>
                {currentAction === 'create' &&
                  t(
                    'campaigns.addDescription',
                    'Create a new campaign for your team.',
                  )}
                {currentAction === 'edit' &&
                  t('campaigns.editDescription', 'Update campaign details.')}
                {currentAction === 'view' &&
                  t('campaigns.viewDescription', 'View campaign information.')}
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
                          disabled={currentAction === 'view'}
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
                          disabled={currentAction === 'view'}
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
                        disabled={currentAction === 'view'}
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
                          <Input
                            type="date"
                            {...field}
                            disabled={currentAction === 'view'}
                          />
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
                          <Input
                            type="date"
                            {...field}
                            disabled={currentAction === 'view'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Service Types Multi-Select */}
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
                                        service.serviceType,
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || []
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            service.serviceType,
                                          ])
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (v) => v !== service.serviceType,
                                            ),
                                          )
                                        }
                                      }}
                                      disabled={currentAction === 'view'}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {service.serviceType === 'voice' &&
                                      t('services.voice', 'VoIP')}
                                    {service.serviceType === 'sms' &&
                                      t('services.sms', 'SMS')}
                                    {service.serviceType === 'whatsapp' &&
                                      t('services.whatsapp', 'WhatsApp')}
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
                  {currentAction !== 'view' && (
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {(isCreating || isUpdating) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {currentAction === 'create'
                        ? t('common.create', 'Create')
                        : t('common.save', 'Save')}
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={currentAction === 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('common.confirmDelete', 'Confirm Delete')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'campaigns.deleteConfirmation',
                  'Are you sure you want to delete this campaign? This action cannot be undone.',
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.delete', 'Delete')}
              </Button>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isDeleting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
