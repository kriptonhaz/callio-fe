import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/lib/auth-guard';

export const Route = createFileRoute('/dashboard/campaigns')({
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
      </div>
    </RoleGuard>
  );
}
