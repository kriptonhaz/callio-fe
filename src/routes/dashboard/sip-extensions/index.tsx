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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
      toast.success('SIP extension created successfully')
      setCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      toast.error('Failed to create SIP extension')
    }
  }

  // Handle bulk create submission
  const onBulkSubmit = async (values: z.infer<typeof bulkFormSchema>) => {
    try {
      const result = await bulkCreateMutation.mutateAsync(values)
      toast.success(`Successfully created ${result.created} extensions`)
      setBulkCreateDialogOpen(false)
      bulkForm.reset()
    } catch (error) {
      toast.error('Failed to bulk create SIP extensions')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingExtension) return

    try {
      await deleteMutation.mutateAsync(deletingExtension.id)
      toast.success('SIP extension deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingExtension(null)
    } catch (error) {
      toast.error('Failed to delete SIP extension')
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
        label: 'User',
        icon: Users,
        variant: 'default' as const,
      }
    } else if (extensionType === 'goip') {
      return {
        label: 'GoIP',
        icon: Router,
        variant: 'secondary' as const,
      }
    }
    return {
      label: 'Unknown',
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
          {row.original.webrtc === 'yes' ? 'Enabled' : 'Disabled'}
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
          return <span>{row.original.assignedTo}</span>
        }

        return <Badge variant="outline">Unassigned</Badge>
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
        <div className="p-4 text-red-500">Error loading SIP extensions</div>
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
            Bulk Create
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
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    updateParams({ page: Math.max(1, searchParams.page - 1) })
                  }
                  className={
                    searchParams.page <= 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{searchParams.page}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => updateParams({ page: searchParams.page + 1 })}
                  className={
                    !data?.meta.totalPages ||
                    searchParams.page >= data.meta.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Create Extension Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SIP Extension</DialogTitle>
            <DialogDescription>
              Create a new SIP extension for your system.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension ID</FormLabel>
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
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select extension type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="goip">GoIP</SelectItem>
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
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
                  {createMutation.isPending ? 'Creating...' : 'Create'}
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
            <DialogTitle>Bulk Create SIP Extensions</DialogTitle>
            <DialogDescription>
              Create multiple SIP extensions in a range.
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
                    <FormLabel>Range Start</FormLabel>
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
                    <FormLabel>Range End</FormLabel>
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
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select extension type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="goip">GoIP</SelectItem>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={bulkCreateMutation.isPending}>
                  {bulkCreateMutation.isPending ? 'Creating...' : 'Create'}
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the SIP extension{' '}
              <strong>{deletingExtension?.id}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}
