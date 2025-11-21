import { createFileRoute } from '@tanstack/react-router';
import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t('dashboard.title')}</h2>
      </div>
      
      <KPICards />
      <Charts />
      <RecentActivityTable />
    </div>
  );
}
