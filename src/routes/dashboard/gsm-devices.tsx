import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/lib/auth-guard';

export const Route = createFileRoute('/dashboard/gsm-devices')({
  component: GsmDevicesPage,
});

function GsmDevicesPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">GSM Devices</h1>
      </div>
    </RoleGuard>
  );
}
