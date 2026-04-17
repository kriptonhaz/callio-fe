import { format } from 'date-fns'
import { CalendarIcon, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUsers } from '@/hooks/api/useUsers'
import { useCampaigns } from '@/hooks/api/useCampaigns'
import { UserRole } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface PerformanceFilters {
  startDate?: string
  endDate?: string
  agentId?: string
  campaignId?: string
}

interface Props {
  filters: PerformanceFilters
  onChange: (next: PerformanceFilters) => void
  onExportLeads: () => void
  onExportCalls: () => void
  isExporting?: boolean
}

const ALL = 'all'

export function PerformanceFiltersBar({
  filters,
  onChange,
  onExportLeads,
  onExportCalls,
  isExporting,
}: Props) {
  const { data: agentsResp } = useUsers({ role: UserRole.AGENT, limit: 100 })
  const { data: campaignsResp } = useCampaigns({ limit: 100 })

  const agents = agentsResp?.data ?? []
  const campaigns = campaignsResp?.data ?? []

  const startDate = filters.startDate ? new Date(filters.startDate) : undefined
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Start date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !startDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'dd MMM yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) =>
                onChange({
                  ...filters,
                  startDate: d ? format(d, 'yyyy-MM-dd') : undefined,
                })
              }
              disabled={(d) =>
                (endDate ? d > endDate : false) || d > new Date()
              }
            />
          </PopoverContent>
        </Popover>

        {/* End date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-start text-left font-normal',
                !endDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'dd MMM yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(d) =>
                onChange({
                  ...filters,
                  endDate: d ? format(d, 'yyyy-MM-dd') : undefined,
                })
              }
              disabled={(d) =>
                (startDate ? d < startDate : false) || d > new Date()
              }
            />
          </PopoverContent>
        </Popover>

        {/* Agent */}
        <Select
          value={filters.agentId ?? ALL}
          onValueChange={(v) =>
            onChange({ ...filters, agentId: v === ALL ? undefined : v })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Campaign */}
        <Select
          value={filters.campaignId ?? ALL}
          onValueChange={(v) =>
            onChange({ ...filters, campaignId: v === ALL ? undefined : v })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportLeads}>
            One row per lead
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportCalls}>
            One row per call attempt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
