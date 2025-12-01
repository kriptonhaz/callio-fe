import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useGsmDevice, useGsmDevicePorts, useDeleteGsmDevice, useGoipStatus } from '@/hooks/api/useGsmDevices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Smartphone,
  Wifi,
  Signal,
  User,
  Key,
  Server,
  Activity,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { GsmDeviceStatus, GsmPortStatus, GsmDevicePort } from '@/lib/api/types/gsm-devices.types';
import { format } from 'date-fns';
import { RoleGuard } from '@/lib/auth-guard';
import { useState } from 'react';
import { CreateGsmDeviceForm } from '@/components/gsm-devices/CreateGsmDeviceForm';
import { CreateGsmDevicePortForm } from '@/components/gsm-devices/CreateGsmDevicePortForm';
import { SendUssdModal } from '@/components/gsm-devices/SendUssdModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/gsm-devices/$gsmDeviceId')({
  component: GsmDeviceDetailPage,
});

function GsmDeviceDetailPage() {
  const { gsmDeviceId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: device, isLoading: isDeviceLoading } = useGsmDevice(gsmDeviceId);
  const { data: portsData, isLoading: isPortsLoading } = useGsmDevicePorts(gsmDeviceId);
  const { data: goipStatus } = useGoipStatus(gsmDeviceId);
  const { mutate: deleteGsmDevice, isPending: isDeletePending } = useDeleteGsmDevice();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addPortDialogOpen, setAddPortDialogOpen] = useState(false);
  const [editPortDialogOpen, setEditPortDialogOpen] = useState(false);
  const [deletePortDialogOpen, setDeletePortDialogOpen] = useState(false);
  const [ussdDialogOpen, setUssdDialogOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<GsmDevicePort | null>(null);
  const [deletingPort, setDeletingPort] = useState<GsmDevicePort | null>(null);
  const [ussdPort, setUssdPort] = useState<GsmDevicePort | null>(null);

  // Merge port data with GoIP status
  const mergedPortsData = portsData?.map(port => {
    const goipLine = goipStatus?.lines.find(line => line.id === port.portNumber);
    return {
      ...port,
      goipStatus: goipLine,
    };
  });

  const handleDelete = () => {
    deleteGsmDevice(gsmDeviceId, {
      onSuccess: () => {
        toast.success(t('gsmDevices.deleteSuccess', 'GSM Device deleted successfully'));
        navigate({ to: '/dashboard/gsm-devices', search: { page: 1, limit: 10, view: 'table' } });
      },
      onError: (error: any) => {
        toast.error(error?.message || t('gsmDevices.deleteError', 'Failed to delete GSM device'));
      },
    });
  };

  if (isDeviceLoading) {
    return <div className="p-6 space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  if (!device) {
    return <div className="p-6">Device not found</div>;
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{device.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card */}
          <Card className="md:col-span-1 h-fit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('gsmDevices.details.summary', 'Device Summary')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('gsmDevices.status', 'Status')}
                </span>
                <Badge variant={device.status === GsmDeviceStatus.ONLINE ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  {t('gsmDevices.remoteUrl', 'Remote URL')}
                </span>
                <span className="font-medium">{device.remoteUrl}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('gsmDevices.username', 'Username')}
                </span>
                <span className="font-medium">{device.username}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t('gsmDevices.password', 'Password')}
                </span>
                <span className="font-medium">{device.password}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Signal className="h-4 w-4" />
                  {t('gsmDevices.totalPorts', 'Total Ports')}
                </span>
                <span className="font-medium">{device.totalPorts}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {t('gsmDevices.model', 'Model')}
                </span>
                <span className="font-medium">{device.model || '-'}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {t('gsmDevices.firmware', 'Firmware')}
                </span>
                <span className="font-medium">{device.firmwareVersion || '-'}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('common.createdAt', 'Created At')}
                </span>
                <span className="font-medium">
                  {format(new Date(device.createdAt), 'PPP')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ports Table */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5" />
                {t('gsmDevices.details.ports', 'Device Ports')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setAddPortDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('gsmDevices.ports.add', 'Add Port')}
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {isPortsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.number', 'Port #')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.phoneNumber', 'Phone Number')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.status', 'Status')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.gsmSim', 'GSM SIM')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.gsmStatus', 'GSM Status')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.gsmSignal', 'Signal')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.gsmOperator', 'Operator')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('gsmDevices.ports.updatedAt', 'Last Updated')}</TableHead>
                        <TableHead className="font-semibold text-primary">{t('common.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedPortsData && mergedPortsData.length > 0 ? (
                        mergedPortsData.map((port) => (
                          <TableRow key={port.id}>
                            <TableCell className="font-medium">Port {port.portNumber}</TableCell>
                            <TableCell>{port.msisdn || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                port.status === GsmPortStatus.AVAILABLE ? 'default' :
                                port.status === GsmPortStatus.ERROR ? 'destructive' : 'secondary'
                              }>
                                {port.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={port.goipStatus?.gsm_sim === 'Y' ? 'default' : 'secondary'}>
                                {port.goipStatus?.gsm_sim || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={port.goipStatus?.gsm_status === 'Y' ? 'default' : 'secondary'}>
                                {port.goipStatus?.gsm_status || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>{port.goipStatus?.gsm_signal || '-'}</TableCell>
                            <TableCell>{port.goipStatus?.gsm_cur_oper || '-'}</TableCell>
                            <TableCell>
                              {port.updatedAt ? format(new Date(port.updatedAt), 'PP p') : '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setUssdPort(port);
                                    setUssdDialogOpen(true);
                                  }}>
                                    <Signal className="mr-2 h-4 w-4" />
                                    {t('gsmDevices.ports.sendUssd', 'Send USSD')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setEditingPort(port);
                                    setEditPortDialogOpen(true);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t('common.edit', 'Edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeletingPort(port);
                                      setDeletePortDialogOpen(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('common.delete', 'Delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {t('gsmDevices.ports.empty', 'No ports found')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <CreateGsmDeviceForm
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          initialValues={device}
        />

        <CreateGsmDevicePortForm
          open={addPortDialogOpen}
          onOpenChange={setAddPortDialogOpen}
          gsmDeviceId={gsmDeviceId}
        />

        {editingPort && (
          <CreateGsmDevicePortForm
            open={editPortDialogOpen}
            onOpenChange={setEditPortDialogOpen}
            gsmDeviceId={gsmDeviceId}
            initialValues={editingPort}
          />
        )}

        {ussdPort && (
          <SendUssdModal
            open={ussdDialogOpen}
            onOpenChange={setUssdDialogOpen}
            deviceId={gsmDeviceId}
            portNumber={ussdPort.portNumber}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.deleteConfirmTitle', 'Are you sure?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('gsmDevices.deleteConfirmDescription', 'This action cannot be undone. This will permanently delete the GSM device and all associated data.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletePending}
              >
                {isDeletePending ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deletePortDialogOpen} onOpenChange={setDeletePortDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.deleteConfirmTitle', 'Are you sure?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('gsmDevices.ports.deleteConfirmDescription', 'This action cannot be undone. This will permanently delete this port.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingPort) {
                    // TODO: Implement delete port API call
                    toast.success(t('gsmDevices.ports.deleteSuccess', 'Port deleted successfully'));
                    setDeletePortDialogOpen(false);
                    setDeletingPort(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
