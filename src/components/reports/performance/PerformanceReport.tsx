import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  
  PerformanceFiltersBar
} from './PerformanceFilters'
import { PerformanceKpis } from './PerformanceKpis'
import { TimeTrendChart } from './TimeTrendChart'
import { PerAgentSummary } from './PerAgentSummary'
import { OutcomeFunnel } from './OutcomeFunnel'
import { PerLeadDetail } from './PerLeadDetail'
import type {PerformanceFilters} from './PerformanceFilters';
import { useExportCallLogs } from '@/hooks/api/useRemainingModules'
import {
  useExportPerformanceLeadsCsv,
} from '@/hooks/api/usePerformance'
import { useLeadAssignmentAnalytics } from '@/hooks/api/useLeadAssignments'

interface Props {
  initialCampaignId?: string
}

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function thirtyDaysAgo(): string {
  return format(subDays(new Date(), 29), 'yyyy-MM-dd')
}

export function PerformanceReport({ initialCampaignId }: Props) {
  const [filters, setFilters] = useState<PerformanceFilters>({
    startDate: thirtyDaysAgo(),
    endDate: today(),
    campaignId: initialCampaignId,
  })

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
  } = useLeadAssignmentAnalytics({
    ...filters,
    byAgent: true,
    outcomeFunnel: true,
  })

  const exportLeadsMut = useExportPerformanceLeadsCsv()
  const exportCallsMut = useExportCallLogs()

  const isExporting = exportLeadsMut.isPending || exportCallsMut.isPending

  const baseFilters = useMemo(
    () => ({
      agentId: filters.agentId,
      campaignId: filters.campaignId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters],
  )

  const handleExportLeads = async () => {
    try {
      const blob = await exportLeadsMut.mutateAsync(baseFilters)
      triggerDownload(blob, `agent-performance-leads-${today()}.csv`)
      toast.success('Leads CSV downloaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const handleExportCalls = async () => {
    try {
      const blob = await exportCallsMut.mutateAsync(baseFilters)
      triggerDownload(blob, `agent-performance-calls-${today()}.csv`)
      toast.success('Calls CSV downloaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PerformanceFiltersBar
        filters={filters}
        onChange={setFilters}
        onExportLeads={handleExportLeads}
        onExportCalls={handleExportCalls}
        isExporting={isExporting}
      />

      {isLoadingAnalytics ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PerformanceKpis analytics={analytics} />
          <TimeTrendChart data={analytics?.dailyBreakdown} />
          <PerAgentSummary data={analytics?.perAgentBreakdown} />
          <OutcomeFunnel data={analytics?.outcomeFunnel} />
          <PerLeadDetail baseFilters={baseFilters} />
        </>
      )}
    </div>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
