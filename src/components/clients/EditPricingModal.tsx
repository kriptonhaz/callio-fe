import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateEffectivePricing } from '@/hooks/api/usePricing'
import { useUsers } from '@/hooks/api/useUsers'
import { toast } from 'sonner'
import type {
  EffectivePricing,
  ServiceType,
  UnitType,
  Currency,
} from '@/lib/api/types/pricing.types'

const editPricingSchema = z.object({
  pricePerUnit: z.string().min(1, 'Price is required'),
  salesPersonId: z.string().optional(),
  effectiveFrom: z.string().min(1, 'Effective from is required'),
  effectiveUntil: z.string().optional(),
  notes: z.string().optional(),
})

type EditPricingFormValues = z.infer<typeof editPricingSchema>

interface EditPricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pricing: EffectivePricing | null
  clientId: string
}

export function EditPricingModal({
  open,
  onOpenChange,
  pricing,
  clientId,
}: EditPricingModalProps) {
  const { t } = useTranslation()
  const { mutate: updatePricing, isPending } = useUpdateEffectivePricing()

  // Fetch internal users (users without clientId)
  const { data: usersData, isLoading: usersLoading } = useUsers(
    { nullClientId: true, limit: 100 },
    open,
  )

  const form = useForm<EditPricingFormValues>({
    resolver: zodResolver(editPricingSchema),
    defaultValues: {
      pricePerUnit: '0',
      salesPersonId: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveUntil: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open && pricing) {
      form.reset({
        pricePerUnit: String(pricing.pricePerUnit),
        salesPersonId: pricing.salesPerson?.id || '',
        effectiveFrom: pricing.effectiveFrom.split('T')[0],
        effectiveUntil: '',
        notes: '',
      })
    }
  }, [open, pricing, form])

  const onSubmit = (data: EditPricingFormValues) => {
    if (!pricing) return

    const priceValue = parseFloat(data.pricePerUnit)
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error(
        t('clients.pricing.invalidPrice', 'Price must be a positive number'),
      )
      return
    }

    updatePricing(
      {
        clientId,
        data: {
          serviceType: pricing.serviceType as ServiceType,
          pricePerUnit: priceValue,
          unitType: pricing.unitType as UnitType,
          currency: pricing.currency as Currency,
          salesPersonId: data.salesPersonId || null,
          effectiveFrom: data.effectiveFrom,
          effectiveUntil: data.effectiveUntil || null,
          notes: data.notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            t('clients.pricing.updateSuccess', 'Pricing updated successfully'),
          )
          form.reset()
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t('clients.pricing.updateError', 'Failed to update pricing'),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t('clients.pricing.editTitle', 'Edit Pricing')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'clients.pricing.editDescription',
              'Update the pricing for this service type',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>
                  {t('clients.pricing.serviceType', 'Service Type')}
                </FormLabel>
                <Input
                  value={pricing?.serviceType.toUpperCase() || ''}
                  disabled
                  className="bg-muted"
                />
              </FormItem>
              <FormItem>
                <FormLabel>
                  {t('clients.pricing.unitType', 'Unit Type')}
                </FormLabel>
                <Input
                  value={pricing?.unitType || ''}
                  disabled
                  className="bg-muted capitalize"
                />
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>{t('clients.pricing.currency', 'Currency')}</FormLabel>
              <Input
                value={pricing?.currency || ''}
                disabled
                className="bg-muted"
              />
            </FormItem>

            {/* Editable fields */}
            <FormField
              control={form.control}
              name="pricePerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('clients.pricing.pricePerUnit', 'Price Per Unit')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('clients.pricing.salesPerson', 'Sales Person')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={usersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            usersLoading
                              ? t('common.loading', 'Loading...')
                              : t(
                                  'clients.pricing.selectSalesPerson',
                                  'Select sales person',
                                )
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersData?.data.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('clients.pricing.effectiveFrom', 'Effective From')}
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
                name="effectiveUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('clients.pricing.effectiveUntil', 'Effective Until')}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.pricing.notes', 'Notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'clients.pricing.notesPlaceholder',
                        'Optional notes about this pricing...',
                      )}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t('common.updating', 'Updating...')
                  : t('common.update', 'Update')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
