import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

import {
  useOperatorPrefixes,
  useCreateOperatorPrefix,
  useUpdateOperatorPrefix,
  useDeleteOperatorPrefix,
} from '@/hooks/api/useOperatorPrefixes'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Plus,
  Loader2,
  Smartphone,
} from 'lucide-react'
import type { OperatorPrefix } from '@/lib/api/types/operator-prefixes.types'
import { StandardPagination } from '@/components/common/StandardPagination'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Define the form schema
const formSchema = z.object({
  prefix: z
    .string()
    .min(3, { message: 'Prefix must be at least 3 characters.' })
    .max(4, { message: 'Prefix must be at most 4 characters.' })
    .regex(/^[0-9]+$/, { message: 'Prefix must contain only numbers.' }),
  operatorName: z.string().min(2, {
    message: 'Operator name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type OperatorPrefixFormValues = z.infer<typeof formSchema>

interface OperatorPrefixFormProps {
  defaultValues?: Partial<OperatorPrefixFormValues>
  onSubmit: (values: OperatorPrefixFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

function OperatorPrefixForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: OperatorPrefixFormProps) {
  const { t } = useTranslation()
  const form = useForm<OperatorPrefixFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: '',
      operatorName: '',
      description: '',
      isActive: true,
      ...defaultValues,
    },
  })

  // Reset form when defaultValues change (important for Edit mode)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        prefix: defaultValues.prefix || '',
        operatorName: defaultValues.operatorName || '',
        description: defaultValues.description || '',
        isActive: defaultValues.isActive ?? true,
      })
    } else {
      form.reset({
        prefix: '',
        operatorName: '',
        description: '',
        isActive: true,
      })
    }
  }, [defaultValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('operatorPrefix.form.prefix', 'Prefix')}</FormLabel>
              <FormControl>
                <Input placeholder="0812" {...field} />
              </FormControl>
              <FormDescription>
                {t(
                  'operatorPrefix.form.prefixDescription',
                  '3-4 digit phone number prefix',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="operatorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('operatorPrefix.form.operatorName', 'Provider')}
              </FormLabel>
              <FormControl>
                <Input placeholder="TELKOMSEL" {...field} />
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
                {t('operatorPrefix.form.description', 'Description')}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Telkomsel Simpati/Kartu AS prefix"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('operatorPrefix.form.isActive', 'Active')}
                </FormLabel>
                <FormDescription>
                  {t(
                    'operatorPrefix.form.isActiveDescription',
                    'Enable or disable this prefix.',
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

export const Route = createFileRoute('/dashboard/settings/mobile-operator/')({
  component: MobileOperatorPage,
})

function MobileOperatorPage(): React.ReactElement {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [deletingPrefix, setDeletingPrefix] = useState<OperatorPrefix | null>(
    null,
  )
  const [editingPrefix, setEditingPrefix] = useState<OperatorPrefix | null>(
    null,
  )
  const [isAddOpen, setIsAddOpen] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 500)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading, error } = useOperatorPrefixes({
    page,
    limit: itemsPerPage,
  })
  const { mutate: createPrefix, isPending: isCreating } =
    useCreateOperatorPrefix()
  const { mutate: updatePrefix, isPending: isUpdating } =
    useUpdateOperatorPrefix()
  const { mutate: deletePrefix } = useDeleteOperatorPrefix()

  const handleDelete = (prefix: OperatorPrefix): void => {
    setDeletingPrefix(prefix)
  }

  const confirmDelete = (): void => {
    if (deletingPrefix) {
      deletePrefix(deletingPrefix.id, {
        onSuccess: () => {
          toast.success(
            t(
              'operatorPrefix.deleteSuccess',
              'Operator prefix deleted successfully',
            ),
          )
          setDeletingPrefix(null)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t(
                'operatorPrefix.deleteError',
                'Failed to delete operator prefix',
              ),
          )
        },
      })
    }
  }

  const handleEdit = (prefix: OperatorPrefix): void => {
    setEditingPrefix(prefix)
  }

  const handleCreate = (): void => {
    setIsAddOpen(true)
  }

  const handleUpsert = (values: any): void => {
    if (editingPrefix) {
      updatePrefix(
        { id: editingPrefix.id, data: values },
        {
          onSuccess: () => {
            toast.success(
              t(
                'operatorPrefix.updateSuccess',
                'Operator prefix updated successfully',
              ),
            )
            setEditingPrefix(null)
          },
          onError: (error: Error) => {
            toast.error(
              error?.message ||
                t(
                  'operatorPrefix.updateError',
                  'Failed to update operator prefix',
                ),
            )
          },
        },
      )
    } else {
      createPrefix(values, {
        onSuccess: () => {
          toast.success(
            t(
              'operatorPrefix.createSuccess',
              'Operator prefix created successfully',
            ),
          )
          setIsAddOpen(false)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t(
                'operatorPrefix.createError',
                'Failed to create operator prefix',
              ),
          )
        },
      })
    }
  }

  // Filter data based on search
  const prefixes = data?.data ?? []
  const filteredData = prefixes.filter((prefix) => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      prefix.operatorName.toLowerCase().includes(searchLower) ||
      prefix.prefix.toLowerCase().includes(searchLower)
    )
  })

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin', 'admin']}>
        <div className="p-4 text-red-500">
          {t('operatorPrefix.error', 'Error loading operator prefixes')}
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('operatorPrefix.title', 'Mobile Operator')}
          </h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('operatorPrefix.addNew', 'Add Prefix')}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'operatorPrefix.searchPlaceholder',
                'Search by provider or prefix...',
              )}
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
        ) : !filteredData || filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {t('operatorPrefix.empty.title', 'No Operator Prefixes Found')}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              {t(
                'operatorPrefix.empty.description',
                'No operator prefixes configured yet. Add a new prefix to get started.',
              )}
            </p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('operatorPrefix.addNew', 'Add Prefix')}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-center font-semibold text-primary">
                    {t('common.no', '#')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('operatorPrefix.table.provider', 'Provider')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('operatorPrefix.table.prefix', 'Prefix')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('operatorPrefix.table.status', 'Status')}
                  </TableHead>
                  <TableHead className="text-right font-semibold text-primary">
                    {t('common.actions', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((prefix, index) => (
                  <TableRow
                    key={prefix.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(prefix)}
                  >
                    <TableCell className="text-center">
                      {(page - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {prefix.operatorName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {prefix.prefix}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={prefix.isActive ? 'default' : 'secondary'}
                      >
                        {prefix.isActive
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
                              handleEdit(prefix)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(prefix)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            {data && (
              <StandardPagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isAddOpen || !!editingPrefix}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingPrefix(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrefix
                ? t('operatorPrefix.editTitle', 'Edit Operator Prefix')
                : t('operatorPrefix.createTitle', 'Add Operator Prefix')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'operatorPrefix.formDescription',
                'Configure mobile operator prefix settings here.',
              )}
            </DialogDescription>
          </DialogHeader>
          <OperatorPrefixForm
            defaultValues={
              editingPrefix
                ? {
                    ...editingPrefix,
                    description: editingPrefix.description || '',
                  }
                : undefined
            }
            onSubmit={handleUpsert}
            onCancel={() => {
              setIsAddOpen(false)
              setEditingPrefix(null)
            }}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPrefix}
        onOpenChange={(open) => !open && setDeletingPrefix(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('operatorPrefix.deleteTitle', 'Delete Operator Prefix')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'operatorPrefix.deleteDescription',
                'Are you sure you want to delete {{operatorName}} - {{prefix}}? This action cannot be undone.',
                {
                  operatorName: deletingPrefix?.operatorName,
                  prefix: deletingPrefix?.prefix,
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}
