import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { useUsers } from '@/hooks/api/useUsers'
import { useDebounce } from '@/hooks/useDebounce'
import { InternalUserSheet } from '@/components/internal-user/InternalUserSheet'
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

import { StandardPagination } from '@/components/common/StandardPagination'
import { Plus, Search, Users as UsersIcon } from 'lucide-react'
import { User } from '@/lib/api/types/users.types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type InternalUserSearch = {
  page: number
  limit: number
  search?: string
}

export const Route = createFileRoute('/dashboard/internal-user/')({
  component: InternalUserPage,
  validateSearch: (search: Record<string, unknown>): InternalUserSearch => {
    return {
      page: Number(search?.page ?? 1),
      limit: Number(search?.limit ?? 10),
      search: (search?.search as string) || undefined,
    }
  },
})

function InternalUserPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [searchValue, setSearchValue] = useState(searchParams.search || '')

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const debouncedSearch = useDebounce(searchValue, 500)

  const { data, isLoading, error, refetch } = useUsers({
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
    nullClientId: true, // Filter for users without clientId (internal users)
  })

  const updateParams = (updates: Partial<InternalUserSearch>) => {
    navigate({
      search: ((prev: InternalUserSearch) => ({ ...prev, ...updates })) as any,
    })
  }

  const getStatusVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleCreate = () => {
    setSelectedUser(null) // Clear selection for create mode
    setSheetOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setSheetOpen(true)
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: t('internalUser.table.name', 'Name'),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'email',
      header: t('internalUser.table.email', 'Email'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'phone',
      header: t('internalUser.table.phone', 'Phone'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.phone || '-'}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: t('internalUser.table.role', 'Role'),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: t('internalUser.table.status', 'Status'),
      cell: ({ row }) => (
        <Badge
          variant={getStatusVariant(row.original.status)}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
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
        <div className="p-4 text-red-500">Error loading internal users</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t('internalUser.title', 'Internal Users')}
        </h1>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'internalUser.searchPlaceholder',
                'Search users...',
              )}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
              }}
              className="pl-8"
            />
          </div>
          <Button className="w-full sm:w-auto" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('internalUser.create', 'Add User')}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
            <div className="bg-background p-4 rounded-full mb-4">
              <UsersIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {t('internalUser.empty.title', 'No Internal Users Found')}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              {t(
                'internalUser.empty.description',
                'Get started by adding your first internal user to the system.',
              )}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('internalUser.create', 'Add User')}
            </Button>
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
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleEdit(row.original)}
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

      <InternalUserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialValues={selectedUser}
        onSuccess={() => {
          refetch()
          setSheetOpen(false)
        }}
      />
    </RoleGuard>
  )
}
