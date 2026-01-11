import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { useActivePricings, useDeletePricing } from '@/hooks/api/usePricing'
import { useDebounce } from '@/hooks/useDebounce'
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
import { Search, MoreHorizontal, Edit, Trash } from 'lucide-react'
import type { DefaultPricing } from '@/lib/api/types/pricing.types'
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

export const Route = createFileRoute('/dashboard/settings/default-pricing/')({
  component: DefaultPricingPage,
})

function DefaultPricingPage() {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [deletingPricing, setDeletingPricing] = useState<DefaultPricing | null>(
    null,
  )
  const debouncedSearch = useDebounce(searchValue, 500)
  const { mutate: deletePricing } = useDeletePricing()
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading, error } = useActivePricings()

  const handleDelete = (pricing: DefaultPricing) => {
    setDeletingPricing(pricing)
  }

  const confirmDelete = () => {
    if (deletingPricing) {
      deletePricing(deletingPricing.id, {
        onSuccess: () => {
          toast.success(
            t('pricing.deleteSuccess', 'Pricing deleted successfully'),
          )
          setDeletingPricing(null)
        },
        onError: (error: any) => {
          toast.error(
            error?.message ||
              t('pricing.deleteError', 'Failed to delete pricing'),
          )
        },
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const columns: ColumnDef<DefaultPricing>[] = [
    {
      id: 'number',
      header: () => <div className="text-center">{t('common.no', '#')}</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: 'serviceType',
      header: t('pricing.table.serviceType', 'Service Type'),
      cell: ({ row }) => (
        <div className="font-medium capitalize">
          {row.original.serviceType.replace(/_/g, ' ')}
        </div>
      ),
    },
    {
      accessorKey: 'pricePerUnit',
      header: t('pricing.table.pricePerUnit', 'Price Per Unit'),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.pricePerUnit}</div>
      ),
    },
    {
      accessorKey: 'unitType',
      header: t('pricing.table.unitType', 'Unit Type'),
      cell: ({ row }) => (
        <div className="capitalize">{row.original.unitType}</div>
      ),
    },
    {
      accessorKey: 'currency',
      header: t('pricing.table.currency', 'Currency'),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.currency}
        </Badge>
      ),
    },
    {
      accessorKey: 'effectiveFrom',
      header: t('pricing.table.effectiveFrom', 'Effective From'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatDate(row.original.effectiveFrom)}
        </div>
      ),
    },
    {
      accessorKey: 'effectiveUntil',
      header: t('pricing.table.effectiveUntil', 'Effective Until'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatDate(row.original.effectiveUntil)}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t('pricing.table.isActive', 'Is Active'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive
            ? t('common.active', 'Active')
            : t('common.inactive', 'Inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <div className="text-right">{t('common.actions', 'Actions')}</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
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
                onClick={() => console.log('Edit:', row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit', 'Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row.original)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                {t('common.delete', 'Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

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

  const table = useReactTable({
    data: paginatedData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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
        ) : !filteredData || filteredData.length === 0 ? (
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
                    className="cursor-pointer hover:bg-muted/50"
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

      <AlertDialog
        open={!!deletingPricing}
        onOpenChange={(open) => !open && setDeletingPricing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('pricing.deleteTitle', 'Delete Default Pricing')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'pricing.deleteDescription',
                'Are you sure you want to delete this pricing configuration? This action cannot be undone.',
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
