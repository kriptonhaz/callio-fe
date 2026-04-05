import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Users } from 'lucide-react'
import { useUsers } from '@/hooks/api/useUsers'
import { useAutoAssignLeads } from '@/hooks/api/useCampaigns'
import { UserRole } from '@/lib/api/types'
import { toast } from 'sonner'

interface AutoDistributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  clientId: string
}

export function AutoDistributeDialog({
  open,
  onOpenChange,
  campaignId,
  clientId,
}: AutoDistributeDialogProps) {
  const { t } = useTranslation()
  const [distributionOrder, setDistributionOrder] = useState<
    'sequential' | 'random'
  >('sequential')
  const [preferSameAgent, setPreferSameAgent] = useState(false)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])

  const { data: agentsData, isLoading: isLoadingAgents } = useUsers(
    { role: UserRole.AGENT, clientId, limit: 100 },
    !!clientId && open,
  )
  const agents = agentsData?.data || []

  const { mutate: autoAssign, isPending } = useAutoAssignLeads()
  const hasInitialized = useRef(false)

  // Pre-select all agents only once when data first loads
  useEffect(() => {
    if (open && agents.length > 0 && !hasInitialized.current) {
      setSelectedAgentIds(agents.map((a) => a.id))
      hasInitialized.current = true
    }
  }, [open, agents])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDistributionOrder('sequential')
      setPreferSameAgent(false)
      setSelectedAgentIds([])
      hasInitialized.current = false
    }
  }, [open])

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId],
    )
  }

  const toggleAll = () => {
    if (selectedAgentIds.length === agents.length) {
      setSelectedAgentIds([])
    } else {
      setSelectedAgentIds(agents.map((a) => a.id))
    }
  }

  const handleSubmit = () => {
    if (selectedAgentIds.length === 0) {
      toast.error(
        t('campaigns.selectAtLeastOneAgent', 'Please select at least one agent'),
      )
      return
    }

    autoAssign(
      {
        campaignId,
        data: {
          distributionOrder,
          preferSameAgent: preferSameAgent || undefined,
          agentIds:
            selectedAgentIds.length === agents.length
              ? undefined
              : selectedAgentIds,
        },
      },
      {
        onSuccess: (data) => {
          const summary = data.distribution
            .map((d) => {
              const prev = d.fromPreviousBatch ? ` (${d.fromPreviousBatch} returning)` : ''
              return `${d.agentName}: ${d.leadsAssigned}${prev}`
            })
            .join(', ')
          toast.success(
            t(
              'campaigns.autoDistributeSuccess',
              '{{distributed}} leads distributed to {{agentCount}} agents ({{summary}})',
              {
                distributed: data.distributed,
                agentCount: data.agentCount,
                summary,
              },
            ),
          )
          onOpenChange(false)
        },
        onError: () => {
          toast.error(
            t(
              'campaigns.autoDistributeFailed',
              'Failed to distribute leads',
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('campaigns.autoDistribute', 'Auto Distribute Leads')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'campaigns.autoDistributeDesc',
              'Automatically assign unassigned leads to agents.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Distribution Order */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('campaigns.distributionOrder', 'Distribution Order')}
            </label>
            <Select
              value={distributionOrder}
              onValueChange={(v) =>
                setDistributionOrder(v as 'sequential' | 'random')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">
                  {t('campaigns.sequential', 'Sequential')}
                </SelectItem>
                <SelectItem value="random">
                  {t('campaigns.random', 'Random')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prefer Same Agent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferSameAgent}
              onChange={(e) => setPreferSameAgent(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-gray-300 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium">
                {t('campaigns.preferSameAgent', 'Prefer same agent')}
              </span>
              <p className="text-xs text-muted-foreground">
                {t(
                  'campaigns.preferSameAgentTooltip',
                  'When enabled, leads that were handled by a specific agent before will be assigned to the same agent for continuity.',
                )}
              </p>
            </div>
          </label>

          {/* Agent Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('campaigns.selectAgents', 'Select Agents')}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                className="h-auto py-1 px-2 text-xs"
              >
                {selectedAgentIds.length === agents.length
                  ? t('common.deselectAll', 'Deselect All')
                  : t('common.selectAll', 'Select All')}
              </Button>
            </div>

            {isLoadingAgents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-muted-foreground text-sm">
                <Users className="h-5 w-5 mb-1" />
                {t('campaigns.noAgents', 'No agents available')}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border">
                {agents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.includes(agent.id)}
                      onChange={() => toggleAgent(agent.id)}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {agent.name}
                      </div>
                      {agent.email && (
                        <div className="text-xs text-muted-foreground truncate">
                          {agent.email}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            {agents.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('campaigns.agentsSelected', '{{count}} of {{total}} agents selected', {
                  count: selectedAgentIds.length,
                  total: agents.length,
                })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || selectedAgentIds.length === 0}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('campaigns.distribute', 'Distribute')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
