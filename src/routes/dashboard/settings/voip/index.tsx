import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VoipSettings } from '@/lib/api/types/voip-settings.types'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useUpsertVoipSettings,
  useVoipSettings,
} from '@/hooks/api/useVoipSettings'
import { LastCallStatus } from '@/lib/api/types/lead-assignments.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/dashboard/settings/voip/')({
  component: VoipSettingsPage,
})

const STATUS_LABELS: Record<LastCallStatus, string> = {
  [LastCallStatus.ANSWERED]: 'Answered',
  [LastCallStatus.NO_ANSWER]: 'No Answer',
  [LastCallStatus.BUSY]: 'Busy',
  [LastCallStatus.VOICEMAIL]: 'Voicemail',
  [LastCallStatus.WRONG_NUMBER]: 'Wrong Number',
  [LastCallStatus.CALLBACK_REQUESTED]: 'Callback Requested',
  [LastCallStatus.NOT_INTERESTED]: 'Not Interested',
  [LastCallStatus.INTERESTED]: 'Interested',
  [LastCallStatus.DISCONNECTED]: 'Disconnected',
  [LastCallStatus.INVALID_NUMBER]: 'Invalid Number',
}

const ALL_STATUSES = Object.values(LastCallStatus)

function VoipSettingsPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <VoipSettingsContent />
    </RoleGuard>
  )
}

function VoipSettingsContent() {
  const { data, isLoading, error } = useVoipSettings()
  const { mutateAsync, isPending } = useUpsertVoipSettings()

  const [draft, setDraft] = useState<VoipSettings | null>(null)

  useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">
          Failed to load settings: {error.message}
        </p>
      </div>
    )
  }

  const toggleStatus = (status: LastCallStatus, checked: boolean) => {
    setDraft((prev) => {
      if (!prev) return prev
      const set = new Set(prev.autoAdvanceStatuses)
      if (checked) set.add(status)
      else set.delete(status)
      return { ...prev, autoAdvanceStatuses: Array.from(set) }
    })
  }

  const handleSave = async () => {
    if (draft.autoAdvanceDelaySec < 1 || draft.autoAdvanceDelaySec > 60) {
      toast.error('Delay must be between 1 and 60 seconds')
      return
    }
    if (draft.autoAdvanceEnabled && draft.autoAdvanceStatuses.length === 0) {
      toast.error('Pick at least one call status to trigger auto-advance')
      return
    }
    try {
      const saved = await mutateAsync(draft)
      setDraft(saved)
      toast.success('VoIP settings saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings')
    }
  }

  const enabled = draft.autoAdvanceEnabled

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">VoIP Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure how Work Mode behaves between calls for all agents in your
          client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Advance After Call</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Enable toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="auto-advance-enabled" className="text-sm font-medium">
                Enable auto-advance
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When an agent's call ends with a matching status, automatically
                move to the next lead.
              </p>
            </div>
            <Switch
              id="auto-advance-enabled"
              checked={enabled}
              onCheckedChange={(v) =>
                setDraft((prev) =>
                  prev ? { ...prev, autoAdvanceEnabled: v } : prev,
                )
              }
            />
          </div>

          {enabled && (
            <>
              {/* Delay */}
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label htmlFor="auto-advance-delay" className="text-sm">
                  Delay before advancing
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="auto-advance-delay"
                    type="number"
                    min={1}
                    max={60}
                    value={draft.autoAdvanceDelaySec}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              autoAdvanceDelaySec:
                                parseInt(e.target.value, 10) || 1,
                            }
                          : prev,
                      )
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Agents can cancel during this window.
                </p>
              </div>

              {/* Auto live call */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="auto-live-call" className="text-sm font-medium">
                    Auto-dial next lead
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    After advancing, automatically start a live call to the new
                    lead (same as clicking Call → Live).
                  </p>
                </div>
                <Switch
                  id="auto-live-call"
                  checked={draft.autoAdvanceLiveCall}
                  onCheckedChange={(v) =>
                    setDraft((prev) =>
                      prev ? { ...prev, autoAdvanceLiveCall: v } : prev,
                    )
                  }
                />
              </div>

              {/* Status selection */}
              <div className="flex flex-col gap-2">
                <div>
                  <Label className="text-sm font-medium">
                    Trigger on these call statuses
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auto-advance fires when the ended call is recorded as one of
                    these.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_STATUSES.map((status) => {
                    const checked = draft.autoAdvanceStatuses.includes(status)
                    const id = `status-${status}`
                    return (
                      <label
                        key={status}
                        htmlFor={id}
                        className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleStatus(status, v === true)
                          }
                        />
                        {STATUS_LABELS[status]}
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleSave} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
