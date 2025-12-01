import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useGsmDevice, useGsmDevicePorts } from '@/hooks/api/useGsmDevices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { GsmDeviceStatus, GsmPortStatus } from '@/lib/api/types/gsm-devices.types';
import { format } from 'date-fns';
import { RoleGuard } from '@/lib/auth-guard';

export const Route = createFileRoute('/dashboard/gsm-devices/$gsmDeviceId')({
  component: GsmDeviceDetailPage,
});

function GsmDeviceDetailPage() {
  const { gsmDeviceId } = Route.useParams();
  const { t } = useTranslation();
  const { data: device, isLoading: isDeviceLoading } = useGsmDevice(gsmDeviceId);
  const { data: portsData, isLoading: isPortsLoading } = useGsmDevicePorts(gsmDeviceId);

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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('gsmDevices.details.summary', 'Device Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5" />
                {t('gsmDevices.details.ports', 'Device Ports')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPortsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>{t('gsmDevices.ports.number', 'Port #')}</TableHead>
                        <TableHead>{t('gsmDevices.ports.phoneNumber', 'Phone Number')}</TableHead>
                        <TableHead>{t('gsmDevices.ports.status', 'Status')}</TableHead>
                        <TableHead>{t('gsmDevices.ports.updatedAt', 'Last Updated')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portsData?.data?.map((port: any) => (
                        <TableRow key={port.id}>
                          <TableCell className="font-medium">Port {port.portNumber}</TableCell>
                          <TableCell>{port.phoneNumber || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              port.status === GsmPortStatus.ACTIVE ? 'default' :
                              port.status === GsmPortStatus.ERROR ? 'destructive' : 'secondary'
                            }>
                              {port.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {port.updatedAt ? format(new Date(port.updatedAt), 'PP p') : '-'}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
      </div>
    </RoleGuard>
  );
}
