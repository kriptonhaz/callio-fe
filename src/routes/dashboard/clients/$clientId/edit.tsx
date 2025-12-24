import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useClient, useUpdateClient } from '@/hooks/api/useClients'
import { useClientServices } from '@/hooks/api/useServices'
import { ClientStatus } from '@/lib/api/types/clients.types'
import { ServiceType } from '@/lib/api/types/services.types'
import { ArrowLeft, CalendarIcon, Save } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/clients/$clientId/edit')({
  component: EditClientPage,
})

const serviceSchema = z.object({
  isEnabled: z.boolean(),
  expiresAt: z.date().nullable().optional(),
})

const editClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ClientStatus),
  subscriptionPlan: z.string().optional(),
  subscriptionExpiry: z.date().nullable().optional(),
  services: z.record(z.string(), serviceSchema),
})

type EditClientFormValues = z.infer<typeof editClientSchema>

function EditClientPage() {
  const { clientId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: client, isLoading: isLoadingClient } = useClient(clientId)
  const { data: servicesData, isLoading: isLoadingServices } =
    useClientServices(clientId)
  const updateClient = useUpdateClient()

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: ClientStatus.ACTIVE,
      subscriptionPlan: '',
      services: {},
    },
  })

  // Reset form when client data is loaded
  useEffect(() => {
    if (client) {
      const servicesMap: Record<
        string,
        { isEnabled: boolean; expiresAt?: Date | null }
      > = {}

      // Initialize all service types
      Object.values(ServiceType).forEach((type) => {
        const existing = servicesData?.find((s) => s.serviceType === type)
        // If service exists, use its values. If not, defaults (false/null).
        servicesMap[type] = {
          isEnabled: existing?.isEnabled ?? false,
          expiresAt: existing?.expiresAt ? new Date(existing.expiresAt) : null,
        }
      })

      form.reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        status: client.status,
        subscriptionPlan: client.subscriptionPlan || '',
        subscriptionExpiry: client.subscriptionExpiry
          ? new Date(client.subscriptionExpiry)
          : null,
        services: servicesMap,
      })
    }
  }, [client, servicesData, form])

  const onSubmit = async (data: EditClientFormValues) => {
    try {
      // Prepare payload
      // Transform services map to array of UpdateClientServiceRequest
      const servicesPayload = (
        Object.entries(data.services) as [
          string,
          { isEnabled: boolean; expiresAt?: Date | null },
        ][]
      ).map(([type, serviceData]) => ({
        serviceType: type as ServiceType,
        isEnabled: serviceData.isEnabled,
        expiresAt: serviceData.expiresAt
          ? format(serviceData.expiresAt, 'yyyy-MM-dd')
          : null,
      }))

      // Single Update Call
      await updateClient.mutateAsync({
        id: clientId,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          status: data.status,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionExpiry: data.subscriptionExpiry
            ? format(data.subscriptionExpiry, 'yyyy-MM-dd')
            : undefined,
          services: servicesPayload,
        },
      })

      toast.success(t('clients.updateSuccess', 'Client updated successfully'))
      navigate({
        to: '/dashboard/clients/$clientId',
        params: { clientId },
      })
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message || t('clients.updateError', 'Failed to update client'),
      )
    }
  }

  if (isLoadingClient || isLoadingServices) {
    return (
      <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        {t('clients.notFound', 'Client not found')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: '/dashboard/clients/$clientId',
                params: { clientId },
              })
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('clients.editTitle', 'Edit Client')}
          </h1>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Client Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('clients.form.sections.details', 'Client Details')}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.form.name', 'Name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'clients.form.placeholders.name',
                            'Acme Corp',
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.form.email', 'Email')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'clients.form.placeholders.email',
                            'contact@acme.com',
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.form.phone', 'Phone')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'clients.form.placeholders.phone',
                            '+1 234 567 890',
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
                      <FormLabel>
                        {t('clients.form.status', 'Status')}
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          {Object.values(ClientStatus).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>
                        {t('clients.form.address', 'Address')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'clients.form.placeholders.address',
                            '123 Main St, City, Country',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Subscription Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('clients.form.sections.subscription', 'Subscription')}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="subscriptionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('clients.form.subscriptionPlan', 'Plan')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'clients.form.placeholders.plan',
                            'Pro',
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
                  name="subscriptionExpiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t('clients.form.subscriptionExpiry', 'Expiry Date')}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>
                                  {t('common.pickDate', 'Pick a date')}
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('clients.form.sections.services', 'Active Services')}
              </h2>
              <div className="grid gap-6">
                {Object.values(ServiceType).map((type) => (
                  <div
                    key={type}
                    className="flex flex-col space-y-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                  >
                    <div className="flex items-center space-x-4">
                      <FormField
                        control={form.control}
                        name={`services.${type}.isEnabled`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-medium capitalize">
                              {t(`services.${type}`, type)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Expiry Date Picker - Only show IF enabled */}
                    {form.watch(`services.${type}.isEnabled`) && (
                      <FormField
                        control={form.control}
                        name={`services.${type}.expiresAt`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-[240px] pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>
                                        {t('services.pickDate', 'Pick a date')}{' '}
                                        (Optional)
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
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: '/dashboard/clients/$clientId',
                    params: { clientId },
                  })
                }
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateClient.isPending
                  ? t('common.saving', 'Saving...')
                  : t('common.save', 'Save')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
