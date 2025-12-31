import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { StandardPagination } from '@/components/common/StandardPagination'
import { Plus, Search, UserPlus, UserMinus } from 'lucide-react'
import { Users, UserCheck } from '@/components/animate-ui/icons'
import { useClients } from '@/hooks/api/useClients'
import { Client, ClientStatus } from '@/lib/api/types/clients.types'
import { useDebounce } from '../../../hooks/useDebounce'
import { useState } from 'react'
import { RoleGuard } from '@/lib/auth-guard'

type ClientSearch = {
  page: number
  limit: number
  search?: string
  status?: ClientStatus
}

export const Route = createFileRoute('/dashboard/clients/')({
  component: ClientListPage,
  validateSearch: (search: Record<string, unknown>): ClientSearch => {
    return {
      page: Number(search?.page ?? 1),
      limit: Number(search?.limit ?? 10),
      search: (search?.search as string) || undefined,
      status: (search?.status as ClientStatus) || undefined,
    }
  },
})

function ClientListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [searchValue, setSearchValue] = useState(searchParams.search || '')
  const debouncedSearch = useDebounce(searchValue, 500)

  const { data, isLoading, error } = useClients({
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
    status: searchParams.status,
  })

  const updateParams = (updates: Partial<ClientSearch>) => {
    navigate({
      search: ((prev: any) => ({ ...prev, ...updates })) as any,
    })
  }

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: t('clients.table.name', 'Name'),
    },
    {
      accessorKey: 'email',
      header: t('clients.table.email', 'Email'),
    },
    {
      accessorKey: 'phone',
      header: t('clients.table.phone', 'Phone'),
    },
    {
      accessorKey: 'status',
      header: t('clients.table.status', 'Status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as ClientStatus
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === ClientStatus.ACTIVE
                ? 'bg-green-100 text-green-800'
                : status === ClientStatus.INACTIVE
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {status}
          </span>
        )
      },
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
    return <div>Error loading clients</div>
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {t('clients.stats.total', 'Total Clients')}
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  animateOnHover
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {data?.meta.total || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                {t('clients.stats.active', 'Active Clients')}
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  animateOnHover
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {/* This would ideally come from a separate stats API or filtered query */}
                -
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                {t('clients.stats.new', 'New This Month')}
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                -
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                {t('clients.stats.inactive', 'Inactive')}
              </CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <UserMinus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                -
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-[300px]">
              <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
              <Input
                placeholder={t(
                  'clients.searchPlaceholder',
                  'Search clients...',
                )}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  // Debounce is handled by the hook, but we need to update the local state immediately
                  // The effect of debounced value change will trigger the query update
                }}
                className="pl-8"
              />
            </div>
          </div>
          <select
            className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchParams.status || ''}
            onChange={(e) =>
              updateParams({
                status: (e.target.value as ClientStatus) || undefined,
              })
            }
          >
            <option value="">{t('common.all', 'All')}</option>
            {Object.values(ClientStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button onClick={() => navigate({ to: '/dashboard/clients/create' })}>
            <Plus className="mr-2 h-4 w-4" />
            {t('clients.create', 'Add Client')}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
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
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate({
                        to: `/dashboard/clients/$clientId`,
                        params: { clientId: row.original.id },
                      })
                    }
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading
                      ? 'Loading...'
                      : t('common.noResults', 'No results.')}
                  </TableCell>
                </TableRow>
              )}
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
      </div>
    </RoleGuard>
  )
}
