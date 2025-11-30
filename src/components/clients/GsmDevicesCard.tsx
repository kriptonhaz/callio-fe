import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Signal, Activity } from 'lucide-react';
import type { GsmDevice } from '@/lib/api/types/remaining-modules.types';

interface GsmDevicesCardProps {
  devices: GsmDevice[];
  isLoading?: boolean;
}

export function GsmDevicesCard({ devices, isLoading = false }: GsmDevicesCardProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      degraded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'offline':
        return <Activity className="h-4 w-4 text-gray-400" />;
      case 'degraded':
        return <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.gsm.title', 'GSM Devices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.gsm.title', 'GSM Devices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('clients.gsm.noDevices', 'No GSM devices assigned')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('clients.gsm.title', 'GSM Devices')}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-base">{device.deviceName}</CardTitle>
                </div>
                {getStatusIcon(device.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('clients.gsm.status', 'Status')}
                </span>
                {getStatusBadge(device.status)}
              </div>
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t('clients.gsm.imei', 'IMEI')}
                  </span>
                  <span className="text-sm font-mono">{device.imei}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  {t('common.createdAt', 'Created')}: {new Date(device.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
