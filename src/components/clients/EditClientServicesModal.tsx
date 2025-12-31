import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  CalendarIcon,
  Phone,
  MessageSquare,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ServiceType, ClientService } from '@/lib/api/types/services.types'
import { ClientServiceBalance } from '@/lib/api/types/balance.types'
import { useEffect, useState } from 'react'
import {
  useCreateService,
  useUpdateServiceByType,
} from '@/hooks/api/useServices'
import { useCreateBalance, useAdjustBalance } from '@/hooks/api/useBalance'
import { balanceApi } from '@/lib/api/balance'
import { toast } from 'sonner'

interface EditClientServicesModalProps {
  clientId: string
  services: ClientService[]
  balances?: ClientServiceBalance[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const serviceSchema = z.object({
  isEnabled: z.boolean(),
  subscriptionType: z.enum(['prepaid', 'postpaid']),
  expiresAt: z.date().nullable().optional(),
  balanceAmount: z.coerce.number().optional(),
  balanceTokens: z.coerce.number().optional(),
  lowBalanceThreshold: z.coerce.number().optional(),
})

const formSchema = z.object({
  services: z.record(z.string(), serviceSchema),
})

type FormValues = z.infer<typeof formSchema>

export function EditClientServicesModal({
  clientId,
  services,
  balances = [],
  open,
  onOpenChange,
}: EditClientServicesModalProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateServiceByType()
  const createBalanceMutation = useCreateBalance()
  const adjustBalanceMutation = useAdjustBalance()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      services: {},
    },
  })

  useEffect(() => {
    if (open) {
      const servicesMap: Record<
        string,
        {
          isEnabled: boolean
          subscriptionType: 'prepaid' | 'postpaid'
          expiresAt?: Date | null
          balanceAmount?: number
          balanceTokens?: number
          lowBalanceThreshold?: number
        }
      > = {}

      Object.values(ServiceType).forEach((type) => {
        const existing = services.find((s) => s.serviceType === type)
        const balance = balances.find((b) => b.serviceType === type)

        servicesMap[type] = {
          isEnabled: existing?.isEnabled ?? false,
          subscriptionType: existing?.subscriptionType ?? 'postpaid',
          expiresAt: existing?.expiresAt ? new Date(existing.expiresAt) : null,
          balanceAmount: balance?.balance?.balanceAmount
            ? Number(balance.balance.balanceAmount)
            : undefined,
          balanceTokens: balance?.balance?.balanceTokens ?? undefined,
          lowBalanceThreshold:
            balance?.balance?.lowBalanceThreshold ?? undefined,
        }
      })

      form.reset({
        services: servicesMap,
      })
    }
  }, [open, services, balances, form])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Process each service
      for (const [serviceType, serviceData] of Object.entries(data.services)) {
        const existingService = services.find(
          (s) => s.serviceType === serviceType,
        )

        if (serviceData.isEnabled) {
          // Step 1: Create or Update service
          if (existingService) {
            // Service exists → PATCH
            await updateServiceMutation.mutateAsync({
              clientId,
              serviceType,
              data: {
                subscriptionType: serviceData.subscriptionType,
                isEnabled: true,
                expiresAt: serviceData.expiresAt
                  ? serviceData.expiresAt.toISOString()
                  : null,
              },
            })
          } else {
            // New service → POST
            await createServiceMutation.mutateAsync({
              clientId,
              data: {
                serviceType,
                subscriptionType: serviceData.subscriptionType,
                isEnabled: true,
                expiresAt: serviceData.expiresAt
                  ? serviceData.expiresAt.toISOString()
                  : null,
              },
            })
          }

          // Step 2: Handle balance for prepaid services
          if (serviceData.subscriptionType === 'prepaid') {
            const hasBalanceData =
              serviceData.balanceAmount || serviceData.balanceTokens

            if (hasBalanceData) {
              // Check if balance already exists
              const existingBalance = await balanceApi.getServiceBalance(
                clientId,
                serviceType,
              )

              // Check if balance object exists AND has actual balance data
              if (existingBalance && existingBalance.balance) {
                // Balance exists → POST adjust
                const adjustPayload: any = {
                  description: 'Adjusted balance from service configuration',
                }

                if (serviceType === ServiceType.SMS) {
                  adjustPayload.newBalanceTokens =
                    serviceData.balanceTokens || 0
                } else {
                  adjustPayload.newBalanceAmount =
                    serviceData.balanceAmount || 0
                }

                await adjustBalanceMutation.mutateAsync({
                  clientId,
                  serviceType,
                  payload: adjustPayload,
                })
              } else {
                // Balance doesn't exist → POST create
                const balancePayload: any = {
                  currency: 'IDR',
                  lowBalanceThreshold:
                    serviceData.lowBalanceThreshold || undefined,
                }

                if (serviceType === ServiceType.SMS) {
                  balancePayload.balanceTokens = serviceData.balanceTokens || 0
                } else {
                  balancePayload.balanceAmount = serviceData.balanceAmount || 0
                }

                await createBalanceMutation.mutateAsync({
                  clientId,
                  serviceType,
                  payload: balancePayload,
                })
              }
            }
          }
        } else {
          // Service is disabled - check if it was previously enabled and needs to be disabled
          if (existingService && existingService.isEnabled) {
            // Previously enabled service is now disabled → PATCH with isEnabled: false
            await updateServiceMutation.mutateAsync({
              clientId,
              serviceType,
              data: {
                isEnabled: false,
                subscriptionType: existingService.subscriptionType,
              },
            })
          }
        }
      }

      toast.success(t('common.success', 'Success'), {
        description: t(
          'clients.services.updateSuccess',
          'Services updated successfully',
        ),
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error updating services:', error)
      toast.error(t('common.error', 'Error'), {
        description: t(
          'clients.services.updateError',
          'Failed to update services',
        ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.VOICE:
        return <Phone className="h-5 w-5 text-blue-500" />
      case ServiceType.SMS:
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case ServiceType.WHATSAPP:
        return <MessageCircle className="h-5 w-5 text-green-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case ServiceType.VOICE:
        return t('services.voice', 'Voice')
      case ServiceType.SMS:
        return t('services.sms', 'SMS')
      case ServiceType.WHATSAPP:
        return t('services.whatsapp', 'WhatsApp')
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('clients.services.editTitle', 'Manage Active Services')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'clients.services.editDescription',
              'Configure services, subscription types, and balances for this client.',
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {Object.values(ServiceType).map((type) => {
                const isEnabled = form.watch(`services.${type}.isEnabled`)
                const subscriptionType = form.watch(
                  `services.${type}.subscriptionType`,
                )

                return (
                  <div
                    key={type}
                    className="flex flex-col space-y-4 rounded-lg border p-4"
                  >
                    {/* Service Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-background rounded-full p-2 shadow-sm">
                          {getServiceIcon(type)}
                        </div>
                        <div>
                          <span className="font-medium">
                            {getServiceLabel(type)}
                          </span>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`services.${type}.isEnabled`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormLabel className="text-sm font-normal text-muted-foreground mr-2">
                              {field.value
                                ? t('common.enabled', 'Enabled')
                                : t('common.disabled', 'Disabled')}
                            </FormLabel>
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

                    {/* Configuration Fields - Only show if enabled */}
                    {isEnabled && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Subscription Type */}
                          <FormField
                            control={form.control}
                            name={`services.${type}.subscriptionType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t(
                                    'services.subscriptionType',
                                    'Subscription Type',
                                  )}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="prepaid">
                                      {t('services.prepaid', 'Prepaid')}
                                    </SelectItem>
                                    <SelectItem value="postpaid">
                                      {t('services.postpaid', 'Postpaid')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Expiry Date */}
                          <FormField
                            control={form.control}
                            name={`services.${type}.expiresAt`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  {t('services.expiryDate', 'Expiry Date')}{' '}
                                  (Optional)
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={'outline'}
                                        className={cn(
                                          'w-full pl-3 text-left font-normal',
                                          !field.value &&
                                            'text-muted-foreground',
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, 'PPP')
                                        ) : (
                                          <span>
                                            {t(
                                              'services.pickDate',
                                              'Pick a date',
                                            )}
                                          </span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Balance Configuration - Only for prepaid */}
                        {subscriptionType === 'prepaid' && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-3">
                              {t(
                                'services.balanceConfig',
                                'Balance Configuration',
                              )}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Balance Amount/Tokens */}
                              {type === ServiceType.SMS ? (
                                <FormField
                                  control={form.control}
                                  name={`services.${type}.balanceTokens`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t(
                                          'services.balanceTokens',
                                          'Balance (Tokens)',
                                        )}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="1000"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <FormField
                                  control={form.control}
                                  name={`services.${type}.balanceAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {t(
                                          'services.balanceAmount',
                                          'Balance Amount (IDR)',
                                        )}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="100000"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {/* Low Balance Threshold */}
                              <FormField
                                control={form.control}
                                name={`services.${type}.lowBalanceThreshold`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t(
                                        'services.lowBalanceThreshold',
                                        'Low Balance Threshold',
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder={
                                          type === ServiceType.SMS
                                            ? '100'
                                            : '10000'
                                        }
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('common.processing', 'Processing...')}
                  </>
                ) : (
                  t('common.saveChanges', 'Save Changes')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
