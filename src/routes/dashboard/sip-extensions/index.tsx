import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import {
  useSipExtensions,
  useCreateSipExtension,
  useBulkCreateSipExtension,
  useDeleteSipExtension,
} from '@/hooks/api/useSipExtensions'
import {
  useAllGoipSipConfigs,
  isExtensionAssignedToGoip,
} from '@/hooks/api/useGoipSipConfigs'
import { useDebounce } from '@/hooks/useDebounce'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
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

import {
  Plus,
  Search,
  Phone,
  MoreHorizontal,
  Trash2,
  Users,
  Router,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  SipExtension,
  SipExtensionType,
} from '@/lib/api/types/sip-extension.types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { StandardPagination } from '@/components/common/StandardPagination'
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
import { toast } from 'sonner'

type SipExtensionSearch = {
  page: number
  limit: number
  search?: string
  type?: SipExtensionType
}

const formSchema = z.object({
  id: z
    .string()
    .min(1, 'Extension ID is required')
    .regex(/^\d+$/, 'Extension ID must be numeric'),
  type: z.enum(['user', 'goip']),
  password: z.string().min(1, 'Password is required'),
})

const bulkFormSchema = z
  .object({
    rangeStart: z.number().int().min(1, 'Range start must be at least 1'),
    rangeEnd: z.number().int().min(1, 'Range end must be at least 1'),
    type: z.enum(['user', 'goip']),
  })
  .refine((data) => data.rangeEnd >= data.rangeStart, {
    message: 'Range end must be greater than or equal to range start',
    path: ['rangeEnd'],
  })

export const Route = createFileRoute('/dashboard/sip-extensions/')({
  component: SipExtensionsPage,
  validateSearch: (search: Record<string, unknown>): SipExtensionSearch => {
    return {
      page: Number(search?.page ?? 1),
      limit: Number(search?.limit ?? 10),
      search: (search?.search as string) || undefined,
      type: (search?.type as SipExtensionType) || undefined,
    }
  },
})

function SipExtensionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [searchValue, setSearchValue] = useState(searchParams.search || '')
  const debouncedSearch = useDebounce(searchValue, 500)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingExtension, setDeletingExtension] =
    useState<SipExtension | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { data, isLoading, error } = useSipExtensions({
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
    type: searchParams.type,
  })

  // Fetch GoIP SIP configurations for assignment checking
  const { data: goipConfigs, isLoading: isLoadingGoipConfigs } =
    useAllGoipSipConfigs()

  // Create and delete mutations
  const createMutation = useCreateSipExtension()
  const bulkCreateMutation = useBulkCreateSipExtension()
  const deleteMutation = useDeleteSipExtension()

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      type: 'user',
      password: '',
    },
  })

  const bulkForm = useForm<z.infer<typeof bulkFormSchema>>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      rangeStart: 1001,
      rangeEnd: 1100,
      type: 'user',
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        clientId: null,
      })
      toast.success(t('sipExtensions.createSuccess'))
      setCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      toast.error(t('sipExtensions.createError'))
    }
  }

  // Handle bulk create submission
  const onBulkSubmit = async (values: z.infer<typeof bulkFormSchema>) => {
    try {
      const result = await bulkCreateMutation.mutateAsync(values)
      toast.success(
        t('sipExtensions.bulkCreateSuccess', { count: result.created }),
      )
      setBulkCreateDialogOpen(false)
      bulkForm.reset()
    } catch (error) {
      toast.error(t('sipExtensions.bulkCreateError'))
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingExtension) return

    try {
      await deleteMutation.mutateAsync(deletingExtension.id)
      toast.success(t('sipExtensions.deleteSuccess'))
      setDeleteDialogOpen(false)
      setDeletingExtension(null)
    } catch (error) {
      toast.error(t('sipExtensions.deleteError'))
    }
  }

  const updateParams = (updates: Partial<SipExtensionSearch>) => {
    navigate({
      search: ((prev: any) => ({ ...prev, ...updates })) as any,
    })
  }

  const getExtensionTypeInfo = (extensionType: string | null) => {
    if (extensionType === 'user') {
      return {
        label: t('sipExtensions.type.user'),
        icon: Users,
        variant: 'default' as const,
      }
    } else if (extensionType === 'goip') {
      return {
        label: t('sipExtensions.type.goip'),
        icon: Router,
        variant: 'secondary' as const,
      }
    }
    return {
      label: t('sipExtensions.type.unknown'),
      icon: Phone,
      variant: 'outline' as const,
    }
  }

  const columns: ColumnDef<SipExtension>[] = [
    {
      accessorKey: 'id',
      header: t('sipExtensions.table.id', 'Extension ID'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'transport',
      header: t('sipExtensions.table.transport', 'Transport'),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.transport === 'transport-wss' ? 'default' : 'secondary'
          }
        >
          {row.original.transport}
        </Badge>
      ),
    },
    {
      accessorKey: 'webrtc',
      header: t('sipExtensions.table.webrtc', 'WebRTC'),
      cell: ({ row }) => (
        <Badge
          variant={row.original.webrtc === 'yes' ? 'default' : 'secondary'}
        >
          {row.original.webrtc === 'yes'
            ? t('common.enabled')
            : t('common.disabled')}
        </Badge>
      ),
    },
    {
      accessorKey: 'allow',
      header: t('sipExtensions.table.codecs', 'Codecs'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.allow}
        </span>
      ),
    },
    {
      accessorKey: 'extensionType',
      header: t('sipExtensions.table.type', 'Type'),
      cell: ({ row }) => {
        const typeInfo = getExtensionTypeInfo(row.original.extensionType)
        const Icon = typeInfo.icon
        return (
          <Badge variant={typeInfo.variant} className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {typeInfo.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'assignedTo',
      header: t('sipExtensions.table.assignedTo', 'Assigned To'),
      cell: ({ row }) => {
        // First priority: Client name if assigned to a client
        if (row.original.client?.name) {
          return (
            <div className="flex flex-col">
              <span className="font-medium text-primary">
                {row.original.client.name}
                {row.original.assignedTo &&
                  ` - (${row.original.assignedTo.name})`}
              </span>
              {row.original.isGoipExtension && (
                <div className="mt-1">
                  {!isLoadingGoipConfigs && (
                    <>
                      {(() => {
                        const assignmentInfo = isExtensionAssignedToGoip(
                          row.original.id,
                          goipConfigs || [],
                        )
                        return assignmentInfo.isAssigned ? (
                          <span className="text-xs text-muted-foreground italic">
                            Line {assignmentInfo.lineNumber} -{' '}
                            {assignmentInfo.deviceName}
                          </span>
                        ) : null
                      })()}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        }

        // Second priority: Hardware assignment for GoIP extensions
        if (row.original.isGoipExtension) {
          if (isLoadingGoipConfigs) {
            return (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-sm">Checking...</span>
              </div>
            )
          }

          const assignmentInfo = isExtensionAssignedToGoip(
            row.original.id,
            goipConfigs || [],
          )

          if (assignmentInfo.isAssigned) {
            return (
              <span className="font-medium">
                Line {assignmentInfo.lineNumber} - {assignmentInfo.deviceName}
              </span>
            )
          }
        }

        // Third priority: user assignment field
        if (row.original.assignedTo) {
          return <span>{row.original.assignedTo.name}</span>
        }

        return (
          <Badge variant="outline">
            {t('sipExtensions.status.unassigned')}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {t('common.actions', 'Actions')}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setDeletingExtension(row.original)
                setDeleteDialogOpen(true)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages || -1,
  })

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin']}>
        <div className="p-4 text-red-500">{t('sipExtensions.loadError')}</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-6 p-4">
        {/* Title */}
        <h1 className="text-2xl font-bold">
          {t('sipExtensions.title', 'SIP Extensions')}
        </h1>

        {/* Filters and Actions */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'sipExtensions.searchPlaceholder',
                'Search extensions...',
              )}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={searchParams.type || 'all'}
            onValueChange={(value) =>
              updateParams({
                type: value === 'all' ? undefined : (value as SipExtensionType),
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={t('sipExtensions.filterType', 'Filter by type')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('sipExtensions.allTypes', 'All Types')}
              </SelectItem>
              <SelectItem value={SipExtensionType.USER}>
                {t('sipExtensions.typeUser', 'User')}
              </SelectItem>
              <SelectItem value={SipExtensionType.GOIP}>
                {t('sipExtensions.typeGoip', 'GoIP')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('sipExtensions.create', 'Add Extension')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('sipExtensions.bulkCreate')}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
            <div className="bg-background p-4 rounded-full mb-4">
              <Phone className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {t('sipExtensions.empty.title', 'No SIP Extensions Found')}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              {t(
                'sipExtensions.empty.description',
                'Get started by adding your first SIP extension to the system.',
              )}
            </p>
            <Button onClick={() => {}}>
              <Plus className="mr-2 h-4 w-4" />
              {t('sipExtensions.create', 'Add Extension')}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="font-semibold text-primary"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            {data && (
              <StandardPagination
                currentPage={searchParams.page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                itemsPerPage={searchParams.limit}
                onPageChange={(page) => updateParams({ page })}
              />
            )}
          </div>
        )}
      </div>

      {/* Create Extension Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sipExtensions.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('sipExtensions.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.extensionId')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1004"
                        {...field}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.type')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('sipExtensions.form.selectType')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          {t('sipExtensions.type.user')}
                        </SelectItem>
                        <SelectItem value="goip">
                          {t('sipExtensions.type.goip')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t(
                            'sipExtensions.form.passwordPlaceholder',
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? t('common.creating')
                    : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Extension Dialog */}
      <Dialog
        open={bulkCreateDialogOpen}
        onOpenChange={setBulkCreateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sipExtensions.bulkCreateTitle')}</DialogTitle>
            <DialogDescription>
              {t('sipExtensions.bulkCreateDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...bulkForm}>
            <form
              onSubmit={bulkForm.handleSubmit(onBulkSubmit)}
              className="space-y-4"
            >
              <FormField
                control={bulkForm.control}
                name="rangeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.rangeStart')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1001"
                        {...field}
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkForm.control}
                name="rangeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.rangeEnd')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1100"
                        {...field}
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bulkForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sipExtensions.form.type')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('sipExtensions.form.selectType')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          {t('sipExtensions.type.user')}
                        </SelectItem>
                        <SelectItem value="goip">
                          {t('sipExtensions.type.goip')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkCreateDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={bulkCreateMutation.isPending}>
                  {bulkCreateMutation.isPending
                    ? t('common.creating')
                    : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('sipExtensions.deleteDescription', {
                extension: deletingExtension?.id,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}
