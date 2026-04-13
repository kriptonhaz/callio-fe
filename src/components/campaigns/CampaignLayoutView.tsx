import { useEffect, useMemo, useState } from 'react'
import { Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCampaignLayout,
  useCampaignCustomFieldKeys,
  useUpsertCampaignLayout,
  useResetCampaignLayout,
} from '@/hooks/api/useLayoutConfigs'
import { LayoutBuilder } from '@/components/layout-builder/LayoutBuilder'
import { LayoutRenderer } from '@/components/work-mode/LayoutRenderer'
import { mergeDiscoveredCustomKeys } from '@/lib/layout/default-layout'
import type { LayoutSectionsJson } from '@/lib/api/types/layout-configs.types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function CampaignLayoutView({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error } = useCampaignLayout(campaignId)
  const { data: customKeys } = useCampaignCustomFieldKeys(campaignId)
  const upsert = useUpsertCampaignLayout(campaignId)
  const reset = useResetCampaignLayout(campaignId)

  // `useDefault` mirrors the server's `inherited` flag until the user toggles it.
  const [useDefault, setUseDefault] = useState<boolean>(true)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  useEffect(() => {
    if (data) setUseDefault(data.inherited)
  }, [data?.inherited]) // eslint-disable-line react-hooks/exhaustive-deps

  const previewLayout = useMemo(() => {
    if (!data) return null
    return mergeDiscoveredCustomKeys(data.layout, customKeys?.keys ?? [])
  }, [data, customKeys])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive">
        Failed to load layout: {error?.message ?? 'Unknown error'}
      </p>
    )
  }

  const handleToggle = (next: boolean) => {
    if (next === useDefault) return
    if (next) {
      // Turning back ON — if a custom layout is saved on server, confirm before deleting.
      if (!data.inherited) {
        setConfirmResetOpen(true)
        return
      }
      setUseDefault(true)
    } else {
      // Turning OFF — just reveal the builder; saving will create the override.
      setUseDefault(false)
    }
  }

  const confirmReset = async () => {
    try {
      await reset.mutateAsync()
      toast.success('Reverted to default layout')
      setUseDefault(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset layout')
    } finally {
      setConfirmResetOpen(false)
    }
  }

  const handleSave = async (layout: LayoutSectionsJson) => {
    try {
      await upsert.mutateAsync(layout)
      toast.success('Campaign layout saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save layout')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle row */}
      <div className="flex items-start justify-between gap-4 rounded-md border p-3">
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="use-default-layout"
            className="text-sm font-medium cursor-pointer"
          >
            Use default layout
          </Label>
          <p className="text-xs text-muted-foreground">
            {useDefault
              ? 'This campaign inherits the global default. Turn off to customize for this campaign only.'
              : data.inherited
                ? 'Customizing for this campaign. Save to create an override.'
                : 'This campaign has a custom layout. Turn on to revert to the default.'}
          </p>
        </div>
        <Switch
          id="use-default-layout"
          checked={useDefault}
          onCheckedChange={handleToggle}
          disabled={reset.isPending}
        />
      </div>

      {/* Content */}
      {useDefault ? (
        previewLayout && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Preview of the default layout agents see for this campaign.
                Read-only — turn the toggle off to customize.
              </span>
            </div>
            <div className="opacity-80 pointer-events-none">
              <LayoutRenderer
                layout={previewLayout}
                values={{}}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        )
      ) : (
        <LayoutBuilder
          key={`${data.source}-${campaignId}-${data.inherited ? 'inh' : 'own'}`}
          scope="campaign"
          initialLayout={data.layout}
          discoveredCustomKeys={customKeys?.keys ?? []}
          inherited={data.inherited}
          onSave={handleSave}
          isSaving={upsert.isPending}
        />
      )}

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to default layout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the custom layout saved for this campaign and
              agents will see the global default. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reset.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmReset()
              }}
              disabled={reset.isPending}
            >
              {reset.isPending ? 'Reverting…' : 'Revert'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
