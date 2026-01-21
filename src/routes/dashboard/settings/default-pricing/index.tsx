import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

import { useActivePricings, useUpdatePricing } from '@/hooks/api/usePricing'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MoreHorizontal, Edit, Loader2 } from 'lucide-react'
import type { DefaultPricing } from '@/lib/api/types/pricing.types'
import { StandardPagination } from '@/components/common/StandardPagination'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

export const Route = createFileRoute('/dashboard/settings/default-pricing/')({
  component: DefaultPricingPage,
})

const pricingFormSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required'),
  pricePerUnit: z.string().min(1, 'Price per unit is required'),
  unitType: z.string().min(1, 'Unit type is required'),
  currency: z.string().min(1, 'Currency is required'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveUntil: z.string().optional().nullable(),
  isActive: z.boolean(),
})

type PricingFormValues = z.infer<typeof pricingFormSchema>

interface PricingFormProps {
  defaultValues?: Partial<PricingFormValues>
  onSubmit: (values: PricingFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

function PricingForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PricingFormProps) {
  const { t } = useTranslation()
  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      serviceType: '',
      pricePerUnit: '',
      unitType: '',
      currency: 'IDR',
      effectiveFrom: '',
      effectiveUntil: '',
      isActive: true,
      ...defaultValues,
    },
  })

  // Reset form when defaultValues change (important for Edit mode)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        serviceType: defaultValues.serviceType || '',
        pricePerUnit: defaultValues.pricePerUnit || '',
        unitType: defaultValues.unitType || '',
        currency: defaultValues.currency || 'IDR',
        effectiveFrom: defaultValues.effectiveFrom || '',
        effectiveUntil: defaultValues.effectiveUntil || '',
        isActive: defaultValues.isActive ?? true,
      })
    }
  }, [defaultValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pricing.serviceType', 'Service Type')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'pricing.selectServiceType',
                        'Select service type',
                      )}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pricePerUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('pricing.pricePerUnit', 'Price / Unit')}
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pricing.currency', 'Currency')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="unitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pricing.unitType', 'Unit Type')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'pricing.selectUnitType',
                        'Select unit type',
                      )}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="second">Second</SelectItem>
                  <SelectItem value="minute">Minute</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
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
                  {t('pricing.effectiveFrom', 'Effective From')}
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
                  {t('pricing.effectiveUntil', 'Effective Until')}
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>{t('pricing.isActive', 'Is Active')}</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  {t(
                    'pricing.activeDescription',
                    'Enable or disable this pricing rule',
                  )}
                </div>
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function DefaultPricingPage() {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [editingPricing, setEditingPricing] = useState<DefaultPricing | null>(
    null,
  )
  const debouncedSearch = useDebounce(searchValue, 500)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading, error } = useActivePricings()
  const { mutate: updatePricing, isPending: isUpdating } = useUpdatePricing()

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const handleEdit = (pricing: DefaultPricing): void => {
    setEditingPricing(pricing)
  }

  const handleUpdate = (values: PricingFormValues): void => {
    if (!editingPricing) return

    updatePricing(
      {
        id: editingPricing.id,
        data: {
          ...values,
          effectiveUntil: values.effectiveUntil || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            t('pricing.updateSuccess', 'Pricing updated successfully'),
          )
          setEditingPricing(null)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t('pricing.updateError', 'Failed to update pricing'),
          )
        },
      },
    )
  }

  // Filter data based on search
  const filteredData = data?.filter((pricing) => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      pricing.serviceType.toLowerCase().includes(searchLower) ||
      pricing.unitType.toLowerCase().includes(searchLower) ||
      pricing.currency.toLowerCase().includes(searchLower)
    )
  })

  // Client-side pagination
  const totalItems = filteredData?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedData = filteredData?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  )

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin']}>
        <div className="p-4 text-red-500">Error loading default pricing</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t('pricing.title', 'Default Pricing')}
        </h1>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('pricing.searchPlaceholder', 'Search pricing...')}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
              }}
              className="pl-8"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !paginatedData || paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
            <h3 className="text-lg font-semibold">
              {t('pricing.empty.title', 'No Pricing Found')}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              {t(
                'pricing.empty.description',
                'No default pricing configured yet.',
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-center font-semibold text-primary">
                    {t('common.no', '#')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.serviceType', 'Service Type')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.pricePerUnit', 'Price Per Unit')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.unitType', 'Unit Type')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.currency', 'Currency')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.effectiveFrom', 'Effective From')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.effectiveUntil', 'Effective Until')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('pricing.table.isActive', 'Status')}
                  </TableHead>
                  <TableHead className="text-right font-semibold text-primary">
                    {t('common.actions', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((pricing, index) => (
                  <TableRow
                    key={pricing.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(pricing)}
                  >
                    <TableCell className="text-center">
                      {(page - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium capitalize">
                      {pricing.serviceType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {pricing.pricePerUnit}
                    </TableCell>
                    <TableCell className="capitalize">
                      {pricing.unitType}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {pricing.currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(pricing.effectiveFrom)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(pricing.effectiveUntil)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pricing.isActive ? 'default' : 'secondary'}
                      >
                        {pricing.isActive
                          ? t('common.active', 'Active')
                          : t('common.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t('common.actions', 'Actions')}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(pricing)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            {filteredData && filteredData.length > 0 && (
              <StandardPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPricing}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPricing(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t('pricing.editTitle', 'Edit Default Pricing')}
            </DialogTitle>
            <DialogDescription>
              {t('pricing.editDescription', 'Update pricing details below.')}
            </DialogDescription>
          </DialogHeader>
          <PricingForm
            defaultValues={
              editingPricing
                ? {
                    serviceType: editingPricing.serviceType,
                    pricePerUnit: String(editingPricing.pricePerUnit),
                    unitType: editingPricing.unitType,
                    currency: editingPricing.currency,
                    effectiveFrom: editingPricing.effectiveFrom.split('T')[0],
                    effectiveUntil: editingPricing.effectiveUntil
                      ? editingPricing.effectiveUntil.split('T')[0]
                      : '',
                    isActive: editingPricing.isActive,
                  }
                : undefined
            }
            onSubmit={handleUpdate}
            onCancel={() => setEditingPricing(null)}
            isSubmitting={isUpdating}
          />
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}
