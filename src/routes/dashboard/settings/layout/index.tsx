import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useDefaultLayout,
  useUpsertDefaultLayout,
} from '@/hooks/api/useLayoutConfigs'
import { LayoutBuilder } from '@/components/layout-builder/LayoutBuilder'
import type { LayoutSectionsJson } from '@/lib/api/types/layout-configs.types'

export const Route = createFileRoute('/dashboard/settings/layout/')({
  component: LayoutSettingsPage,
})

function LayoutSettingsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <LayoutSettingsContent />
    </RoleGuard>
  )
}

function LayoutSettingsContent() {
  const { data, isLoading, error } = useDefaultLayout()
  const { mutateAsync, isPending } = useUpsertDefaultLayout()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">
          Failed to load layout: {error?.message ?? 'Unknown error'}
        </p>
      </div>
    )
  }

  const handleSave = async (layout: LayoutSectionsJson) => {
    try {
      await mutateAsync(layout)
      toast.success('Default layout saved')
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to save layout',
      )
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Work Mode Layout</h1>
        <p className="text-sm text-muted-foreground">
          Configure the default layout agents see when working through leads.
          Each campaign can optionally override this default.
        </p>
      </div>

      <LayoutBuilder
        scope="global"
        initialLayout={data.layout}
        onSave={handleSave}
        isSaving={isPending}
      />
    </div>
  )
}
