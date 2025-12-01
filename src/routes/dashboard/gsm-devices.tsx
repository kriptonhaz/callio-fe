import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { RoleGuard } from '@/lib/auth-guard';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { GsmDeviceStatus } from '@/lib/api/types';
import { useGsmDevices } from '@/hooks/api/useGsmDevices';
import { useDebounce } from '../../hooks/useDebounce';
import { CreateGsmDeviceForm } from '@/components/gsm-devices/CreateGsmDeviceForm';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  MoreHorizontal,
  Plus,
  Search,
  LayoutGrid,
  List,
  Smartphone,
  Signal,
  Wifi,
} from 'lucide-react';
import { GsmDevice } from '@/lib/api/types/remaining-modules.types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type GsmDeviceSearch = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  view?: 'table' | 'card';
};

export const Route = createFileRoute('/dashboard/gsm-devices')({
  component: GsmDevicesPage,
  validateSearch: (search: Record<string, unknown>): GsmDeviceSearch => {
    return {
      page: Number(search?.page ?? 1),
      limit: Number(search?.limit ?? 10),
      search: (search?.search as string) || undefined,
      status: (search?.status as string) || undefined,
      view: (search?.view as 'table' | 'card') || 'table',
    };
  },
});

function GsmDevicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [searchValue, setSearchValue] = useState(searchParams.search || '');
  const debouncedSearch = useDebounce(searchValue, 500);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useGsmDevices({
    page: searchParams.page,
    limit: searchParams.limit,
    search: debouncedSearch,
    // status: searchParams.status, // Add status filter if API supports it
  });

  const updateParams = (updates: Partial<GsmDeviceSearch>) => {
    navigate({
      search: ((prev: any) => ({ ...prev, ...updates })) as any,
    });
  };

  const columns: ColumnDef<GsmDevice>[] = [
    {
      accessorKey: 'name',
      header: t('gsmDevices.table.name', 'Name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'remoteUrl',
      header: t('gsmDevices.table.remoteUrl', 'Remote URL'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.remoteUrl}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalPorts',
      header: t('gsmDevices.table.ports', 'Ports'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.totalPorts}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('gsmDevices.table.status', 'Status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === GsmDeviceStatus.ONLINE ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const device = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate({ to: `/dashboard/gsm-devices/${device.id}` })}
              >
                {t('common.view', 'View')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({ to: `/dashboard/gsm-devices/${device.id}/edit` })}
              >
                {t('common.edit', 'Edit')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages || -1,
  });

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin']}>
        <div className="p-4 text-red-500">Error loading GSM devices</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('gsmDevices.title', 'GSM Devices')}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-background p-1">
              <Button
                variant={searchParams.view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateParams({ view: 'table' })}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={searchParams.view === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateParams({ view: 'card' })}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('gsmDevices.create', 'Add Device')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('gsmDevices.searchPlaceholder', 'Search devices...')}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              className="pl-8"
            />
          </div>
          {/* Add more filters here if needed */}
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
                <Smartphone className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t('gsmDevices.empty.title', 'No GSM Devices Found')}</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              {t('gsmDevices.empty.description', 'Get started by adding your first GSM device to the system.')}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('gsmDevices.create', 'Add Device')}
            </Button>
          </div>
        ) : searchParams.view === 'table' ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-primary">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((device) => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {device.name}
                  </CardTitle>
                  <Badge variant={device.status === GsmDeviceStatus.ONLINE ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wifi className="h-4 w-4" />
                      <span>{device.remoteUrl}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Signal className="h-4 w-4" />
                      <span>{device.totalPorts} {t('gsmDevices.ports', 'ports')}</span>
                    </div>
                  </div>
                   <div className="flex justify-end mt-4">
                        <Button variant="outline" size="sm" onClick={() => navigate({ to: `/dashboard/gsm-devices/${device.id}` })}>
                            {t('common.view', 'View')}
                        </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
            <Pagination>
                <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                    onClick={() => updateParams({ page: Math.max(1, searchParams.page - 1) })}
                    className={searchParams.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                </PaginationItem>
                <PaginationItem>
                    <PaginationLink isActive>{searchParams.page}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext
                    onClick={() => updateParams({ page: searchParams.page + 1 })}
                    className={(!data?.meta.totalPages || searchParams.page >= data.meta.totalPages) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
            </div>
        )}
      </div>

      <CreateGsmDeviceForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </RoleGuard>
  );
}
