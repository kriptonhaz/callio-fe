import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react'
import {
  useClientSmsMasking,
  useCreateSmsMasking,
  useUpdateSmsMasking,
  useDeleteSmsMasking,
} from '@/hooks/api/useIpWhitelist'
import { toast } from 'sonner'
import type { ClientService } from '@/lib/api/types/services.types'
import type { SmsMasking } from '@/lib/api/types/ip-whitelist.types'
import { useTranslation } from 'react-i18next'

interface SmsMaskingCardProps {
  clientId: string
  services: ClientService[]
  isLoading?: boolean
}

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Masking name is required')
    .max(20, 'Masking name must be 20 characters or less'),
  description: z.string().optional(),
  isActive: z.boolean(),
  isPrimary: z.boolean(),
})

export function SmsMaskingCard({
  clientId,
  services,
  isLoading,
}: SmsMaskingCardProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMasking, setEditingMasking] = useState<SmsMasking | null>(null)
  const [deletingMasking, setDeletingMasking] = useState<SmsMasking | null>(
    null,
  )

  const createMutation = useCreateSmsMasking()
  const updateMutation = useUpdateSmsMasking()
  const deleteMutation = useDeleteSmsMasking()

  // Check if SMS service is enabled
  const smsService = services.find((s) => s.serviceType === 'sms')
  const isServiceActive = smsService?.isEnabled ?? false

  // Fetch SMS masking data only when SMS service is active
  const { data: maskingData, isLoading: isLoadingMasking } =
    useClientSmsMasking(clientId, isServiceActive)

  const maskingList = maskingData?.data || []
  const activeMaskingList = maskingList.filter((m) => m.isActive)
  const hasMasking = maskingList.length > 0

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      isPrimary: false,
    },
  })

  const openCreateDialog = () => {
    setEditingMasking(null)
    form.reset({
      name: '',
      description: '',
      isActive: true,
      isPrimary: false,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (masking: SmsMasking) => {
    setEditingMasking(masking)
    form.reset({
      name: masking.name,
      description: masking.description || '',
      isActive: masking.isActive,
      isPrimary: masking.clientMaskings?.[0]?.isPrimary ?? false,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingMasking) {
        await updateMutation.mutateAsync({
          id: editingMasking.id,
          clientId,
          data: {
            name: values.name,
            description: values.description,
            isActive: values.isActive,
            isPrimary: values.isPrimary,
          },
        })
        toast.success(
          t(
            'clients.smsMasking.updateSuccess',
            'SMS Masking updated successfully',
          ),
        )
      } else {
        await createMutation.mutateAsync({
          clientId,
          name: values.name,
          description: values.description,
          isActive: values.isActive,
          isPrimary: values.isPrimary,
        })
        toast.success(
          t(
            'clients.smsMasking.createSuccess',
            'SMS Masking created successfully',
          ),
        )
      }
      form.reset()
      setDialogOpen(false)
      setEditingMasking(null)
    } catch {
      toast.error(
        editingMasking
          ? t('clients.smsMasking.updateError', 'Failed to update SMS Masking')
          : t('clients.smsMasking.createError', 'Failed to create SMS Masking'),
      )
    }
  }

  const handleDelete = async () => {
    if (!deletingMasking) return
    try {
      await deleteMutation.mutateAsync({
        id: deletingMasking.id,
        clientId,
      })
      toast.success(
        t(
          'clients.smsMasking.deleteSuccess',
          'SMS Masking deleted successfully',
        ),
      )
      setDeletingMasking(null)
    } catch {
      toast.error(
        t('clients.smsMasking.deleteError', 'Failed to delete SMS Masking'),
      )
    }
  }

  if (isLoading || isLoadingMasking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('clients.smsMasking.title', 'SMS Masking')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className={
          !isServiceActive
            ? 'border-muted bg-muted/20'
            : hasMasking
              ? 'border-l-4 border-l-primary'
              : ''
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('clients.smsMasking.title', 'SMS Masking')}
            </div>
            {isServiceActive && hasMasking && (
              <Button variant="ghost" size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isServiceActive ? (
            <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(
                    'clients.smsMasking.smsNotActive',
                    'SMS Service Not Active',
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    'clients.smsMasking.smsNotActiveDescription',
                    'Enable and activate the SMS service to view SMS masking for this client.',
                  )}
                </p>
              </div>
            </div>
          ) : hasMasking ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('clients.smsMasking.totalMasking', 'Total Masking')}:
                </span>
                <span className="text-sm font-medium">
                  {maskingList.length}
                </span>
                {activeMaskingList.length !== maskingList.length && (
                  <span className="text-xs text-muted-foreground">
                    ({activeMaskingList.length} {t('common.active', 'active')})
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {maskingList.map((masking) => {
                  const isPrimary =
                    masking.clientMaskings?.[0]?.isPrimary ?? false
                  return (
                    <div
                      key={masking.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        !masking.isActive ? 'opacity-50 bg-muted/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={masking.isActive ? 'secondary' : 'outline'}
                          className="font-mono"
                        >
                          {masking.name}
                        </Badge>
                        {isPrimary && (
                          <Badge variant="default" className="text-xs">
                            {t('common.primary', 'Primary')}
                          </Badge>
                        )}
                        {!masking.isActive && (
                          <span className="text-xs text-muted-foreground">
                            ({t('common.inactive', 'inactive')})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(masking)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingMasking(masking)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(
                      'clients.smsMasking.noMasking',
                      'No SMS Masking configured',
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      'clients.smsMasking.noMaskingDescription',
                      'No SMS masking has been set up for this client.',
                    )}
                  </p>
                </div>
              </div>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('clients.smsMasking.addMasking', 'Add SMS Masking')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit SMS Masking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMasking
                ? t('clients.smsMasking.editTitle', 'Edit SMS Masking')
                : t('clients.smsMasking.createTitle', 'Create SMS Masking')}
            </DialogTitle>
            <DialogDescription>
              {editingMasking
                ? t(
                    'clients.smsMasking.editDescription',
                    'Update the SMS masking/sender ID.',
                  )
                : t(
                    'clients.smsMasking.createDescription',
                    'Add a new SMS masking/sender ID for this client.',
                  )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('clients.smsMasking.maskingName', 'Masking Name')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="CALLIO" {...field} maxLength={20} />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'clients.smsMasking.maskingNameHelp',
                        'The sender ID that will appear on SMS messages. Max 20 characters.',
                      )}
                    </FormDescription>
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
                      {t('common.description', 'Description')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          'clients.smsMasking.descriptionPlaceholder',
                          'Optional description for this masking...',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>{t('common.active', 'Active')}</FormLabel>
                        <FormDescription className="text-xs">
                          {t(
                            'clients.smsMasking.activeHelp',
                            'Enable this masking',
                          )}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>{t('common.primary', 'Primary')}</FormLabel>
                        <FormDescription className="text-xs">
                          {t(
                            'clients.smsMasking.primaryHelp',
                            'Set as default masking',
                          )}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t('common.saving', 'Saving...')
                    : editingMasking
                      ? t('common.update', 'Update')
                      : t('common.create', 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMasking}
        onOpenChange={(open) => !open && setDeletingMasking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('clients.smsMasking.deleteTitle', 'Delete SMS Masking')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'clients.smsMasking.deleteDescription',
                'Are you sure you want to delete the SMS masking "{name}"? This action cannot be undone.',
                { name: deletingMasking?.name || '' },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t('common.deleting', 'Deleting...')
                : t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
