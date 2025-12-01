import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/lib/auth-guard';

export const Route = createFileRoute('/dashboard/logs')({
  component: LogsPage,
});

function LogsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">System Logs</h1>
      </div>
    </RoleGuard>
  );
}
