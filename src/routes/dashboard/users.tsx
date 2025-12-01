import { createFileRoute } from '@tanstack/react-router';
import { RoleGuard } from '@/lib/auth-guard';

export const Route = createFileRoute('/dashboard/users')({
  component: UsersPage,
});

function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>
    </RoleGuard>
  );
}
