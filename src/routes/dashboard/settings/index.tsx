import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'

export const Route = createFileRoute('/dashboard/settings/')({
  component: SettingsIndexPage,
})

function SettingsIndexPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin', 'supervisor', 'agent']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
    </RoleGuard>
  )
}
