import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from 'react'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useCampaign,
  useExportCampaignAnalytics,
} from '@/hooks/api/useCampaigns'
import { useAiModels } from '@/hooks/api/useAiModels'
import {
  useWhatsAppAnalytics,
  useStartWhatsAppAnalytics,
  useWhatsAppTimeline,
} from '@/hooks/api/useWhatsappAnalytics'
import { useVoipAnalytics } from '@/hooks/api/useVoipAnalytics'
import { useSmsAnalytics } from '@/hooks/api/useSmsAnalytics'
import { ServiceType } from '@/lib/api/types/services.types'
import {
  ArrowLeft,
  Calendar,
  Users,
  MessageSquare,
  Phone,
  MessageCircle,
  Clock,
  ArrowDownRight,
  Info,
  Loader2,
  Sparkles,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { useHeaderStore } from '@/store/useHeaderStore'
import { toast } from 'sonner'
import type { WhatsAppAnalytics } from '@/lib/api/types/whatsapp-analytics.types'

export const Route = createFileRoute(
  '/dashboard/campaigns/$campaignId/analytic',
)({
  component: CampaignAnalyticsPage,
})

function CampaignAnalyticsPage() {
  const { campaignId } = Route.useParams()
  const { t } = useTranslation()
  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const setCustomContent = useHeaderStore((state) => state.setCustomContent)
  const resetCustomContent = useHeaderStore((state) => state.resetCustomContent)

  // WhatsApp Analytics state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [selectedAiModelId, setSelectedAiModelId] = useState('')
  const [pollingEnabled, setPollingEnabled] = useState(false)

  // Determine enabled services
  const enabledServices = useMemo(() => {
    if (!campaign?.campaignServices) return []
    return campaign.campaignServices.map((s) => s.serviceType)
  }, [campaign])

  const isVoipEnabled = enabledServices.includes(ServiceType.VOICE)
  const isSmsEnabled = enabledServices.includes(ServiceType.SMS)
  const isWhatsappEnabled = enabledServices.includes(ServiceType.WHATSAPP)

  // Set initial tab based on enabled services
  // We'll use a state for the active tab to control switching
  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
    if (activeTab) return // Don't override user selection if already set

    if (isVoipEnabled) {
      setActiveTab('voip')
    } else if (isSmsEnabled) {
      setActiveTab('sms')
    } else if (isWhatsappEnabled) {
      setActiveTab('whatsapp')
    }
  }, [isWhatsappEnabled, isSmsEnabled, isVoipEnabled, activeTab])

  // Fetch AI models
  const { data: aiModelsData, isLoading: isLoadingAiModels } = useAiModels(
    { capability: 'chat', limit: 50 },
    isAiModalOpen,
  )
  const aiModels = aiModelsData?.data ?? []

  // Fetch WhatsApp analytics with conditional polling
  const { data: analyticsData, isLoading: isLoadingAnalytics } =
    useWhatsAppAnalytics(campaignId, {
      refetchInterval: pollingEnabled ? 5000 : false,
      enabled: isWhatsappEnabled,
    })

  // Start analytics mutation
  const { mutate: startAnalytics, isPending: isStartingAnalytics } =
    useStartWhatsAppAnalytics()

  // Enable polling when status is 'processing'
  useEffect(() => {
    if (analyticsData?.status === 'processing') {
      setPollingEnabled(true)
    } else if (
      analyticsData?.status === 'completed' ||
      analyticsData?.status === 'failed'
    ) {
      setPollingEnabled(false)
    }
  }, [analyticsData?.status])

  // Handle start analysis - close modal immediately, don't wait for response
  const handleStartAnalysis = () => {
    if (!selectedAiModelId) {
      toast.error(t('analytics.selectAiModel', 'Please select an AI model'))
      return
    }

    // Close modal and enable polling immediately
    setIsAiModalOpen(false)
    setPollingEnabled(true)
    toast.success(
      t('analytics.analysisStarted', 'Analysis started successfully'),
    )

    // Fire and forget - don't wait for response
    startAnalytics(
      { campaignId, data: { aiModelId: selectedAiModelId } },
      {
        onError: () => {
          toast.error(
            t('analytics.analysisStartFailed', 'Failed to start analysis'),
          )
        },
      },
    )
  }

  // Export analytics
  const { mutate: exportAnalytics, isPending: isExporting } =
    useExportCampaignAnalytics()

  const handleExport = () => {
    exportAnalytics(campaignId, {
      onSuccess: (data) => {
        const url = window.URL.createObjectURL(new Blob([data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute(
          'download',
          `campaign_analytics_${campaignId}_${format(new Date(), 'yyyyMMdd')}.xlsx`,
        )
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        toast.success(
          t('analytics.exportSuccess', 'Analytics exported successfully'),
        )
      },
      onError: () => {
        toast.error(t('analytics.exportFailed', 'Failed to export analytics'))
      },
    })
  }

  // Check if buttons should be disabled (processing state)
  const isProcessing =
    isStartingAnalytics || pollingEnabled || isLoadingAnalytics || isExporting

  // Update header content
  useEffect(() => {
    if (campaign) {
      setCustomContent(
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/dashboard/campaigns/$campaignId"
              params={{ campaignId }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {t('campaigns.analytics', 'Campaign Analytics')}
            </h1>
          </div>
        </div>,
      )
    }

    return () => {
      resetCustomContent()
    }
  }, [campaign, setCustomContent, resetCustomContent, t, campaignId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return <div>Error loading campaign</div>
  }

  // Render analytics content based on status
  const renderWhatsAppAnalyticsContent = () => {
    // Loading state
    if (isLoadingAnalytics) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </p>
        </div>
      )
    }

    // Processing state
    if (analyticsData?.status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-500/10 rounded-full mb-6">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {t('analytics.processingTitle', 'Analyzing Your Campaign...')}
          </h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {t(
              'analytics.processingDescription',
              'Our AI is analyzing your WhatsApp conversations. This may take a few minutes depending on the data volume.',
            )}
          </p>
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('analytics.inProgress', 'Analysis in progress...')}
          </Badge>
        </div>
      )
    }

    // Failed state
    if (analyticsData?.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-red-500/10 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {t('analytics.failedTitle', 'Analysis Failed')}
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {analyticsData.errorMessage ||
              t(
                'analytics.failedDescription',
                'Something went wrong during analysis. Please try again.',
              )}
          </p>
          <Button
            className="bg-orange-500 hover:bg-orange-600 gap-2"
            onClick={() => setIsAiModalOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            {t('analytics.retryAnalysis', 'Retry Analysis')}
          </Button>
        </div>
      )
    }

    // Completed state - show analytics
    if (analyticsData?.status === 'completed') {
      return <WhatsAppAnalyticsDashboard analytics={analyticsData} />
    }

    // Empty / Initial state
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 bg-muted rounded-full mb-6 ring-8 ring-muted/50">
          <BarChart3 className="h-12 w-12 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {t('analytics.emptyTitle', 'Ready to Analyze Your Campaign?')}
        </h3>
        <p className="text-muted-foreground max-w-md mb-8">
          {t(
            'analytics.emptyDescription',
            "We haven't processed the data for this campaign yet. Click the button below to fetch the latest response data and generate your insights dashboard.",
          )}
        </p>
        <Button
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 gap-2 px-8"
          onClick={() => setIsAiModalOpen(true)}
          disabled={isProcessing}
        >
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
          <Sparkles className="h-5 w-5" />
          {t('analytics.startAnalysis', 'Start Analysis')}
        </Button>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground">
                    {t('common.campaigns', 'Campaigns')}
                  </span>
                  <span>/</span>
                  <span className="text-orange-500 font-medium">
                    {campaign.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {campaign.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(campaign.startDate || ''), 'dd MMM')} -{' '}
                        {format(
                          new Date(campaign.endDate || ''),
                          'dd MMM yyyy',
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {t('campaigns.leadsCount', '{{count}} Leads', {
                          count: campaign._count?.leadAssignments || 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-orange-500 hover:bg-orange-600 gap-2 h-10 px-6"
                  onClick={handleExport}
                  disabled={isProcessing}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {t('analytics.downloadAnalytics', 'Download Analytics')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        {activeTab && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                {isVoipEnabled && (
                  <TabsTrigger
                    value="voip"
                    className="flex items-center gap-2 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {t('services.voip', 'VoIP')}
                  </TabsTrigger>
                )}
                {isSmsEnabled && (
                  <TabsTrigger
                    value="sms"
                    className="flex items-center gap-2 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t('services.sms', 'SMS')}
                  </TabsTrigger>
                )}
                {isWhatsappEnabled && (
                  <TabsTrigger
                    value="whatsapp"
                    className="flex items-center gap-2 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('services.whatsapp', 'WhatsApp')}
                  </TabsTrigger>
                )}
              </TabsList>
              {/* Re-Analyze Button - outside TabsList on the right */}
              {activeTab === 'whatsapp' && analyticsData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsAiModalOpen(true)}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Sparkles className="h-4 w-4" />
                  {t('analytics.reAnalyze', 'Re-Analyze')}
                </Button>
              )}
            </div>

            {isVoipEnabled && (
              <TabsContent value="voip" className="space-y-6">
                <VoipAnalyticsDashboard campaignId={campaignId} />
              </TabsContent>
            )}

            {isSmsEnabled && (
              <TabsContent value="sms" className="space-y-6">
                <SmsAnalyticsDashboard campaignId={campaignId} />
              </TabsContent>
            )}

            {isWhatsappEnabled && (
              <TabsContent value="whatsapp" className="space-y-6">
                {renderWhatsAppAnalyticsContent()}
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* AI Model Selection Modal */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              {t('analytics.selectAiProvider', 'Select AI Provider')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'analytics.selectAiProviderDescription',
                'Choose an AI model to analyze your WhatsApp conversations and generate insights.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.aiModel', 'AI Model')}
              </label>
              <Select
                value={selectedAiModelId}
                onValueChange={setSelectedAiModelId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingAiModels
                        ? t('common.loading', 'Loading...')
                        : t('campaigns.selectAiModel', 'Select AI model')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAiModalOpen(false)}
              disabled={isStartingAnalytics}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 gap-2"
              onClick={handleStartAnalysis}
              disabled={!selectedAiModelId || isStartingAnalytics}
            >
              {isStartingAnalytics && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Sparkles className="h-4 w-4" />
              {t('analytics.startAnalysis', 'Start Analysis')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}

// Separate component for the completed analytics dashboard
function WhatsAppAnalyticsDashboard({
  analytics,
}: {
  analytics: WhatsAppAnalytics
}) {
  const { t } = useTranslation()
  const { campaignId } = Route.useParams()
  const [timelinePeriod, setTimelinePeriod] = useState<'hourly' | 'daily'>(
    'hourly',
  )

  // Fetch timeline data
  const { data: timelineResponse } = useWhatsAppTimeline(campaignId, {
    period: timelinePeriod,
  })

  // Transform timeline data
  const timelineData = useMemo(() => {
    if (!timelineResponse?.data) return []
    return timelineResponse.data.map((point) => ({
      time: point.hour,
      value: point.count,
    }))
  }, [timelineResponse])

  // Transform API data for charts - using snake_case keys from API
  const sentimentData = useMemo(() => {
    const { sentimentSummary } = analytics
    const total =
      (sentimentSummary.positive_count || 0) +
      (sentimentSummary.negative_count || 0) +
      (sentimentSummary.neutral_count || 0)
    if (total === 0) return []

    return [
      {
        name: 'Positive',
        value: Math.round(
          ((sentimentSummary.positive_count || 0) / total) * 100,
        ),
        color: '#22C55E',
      },
      {
        name: 'Neutral',
        value: Math.round(
          ((sentimentSummary.neutral_count || 0) / total) * 100,
        ),
        color: '#EAB308',
      },
      {
        name: 'Negative',
        value: Math.round(
          ((sentimentSummary.negative_count || 0) / total) * 100,
        ),
        color: '#EF4444',
      },
    ]
  }, [analytics])

  const categoryData = useMemo(() => {
    const colors = [
      '#F97316',
      '#3B82F6',
      '#22C55E',
      '#A855F7',
      '#EAB308',
      '#EF4444',
    ]
    return Object.entries(analytics.categoryDistribution || {}).map(
      ([name, value], index) => ({
        name,
        value: value as number,
        color: colors[index % colors.length],
      }),
    )
  }, [analytics])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalDelivered', 'Total Delivered')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.totalDelivered.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-purple-500 rotate-180" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalResponses', 'Total Responses')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.totalResponses.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="font-bold text-orange-500 text-lg">%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.responseRate', 'Response Rate')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.responseRate.toFixed(2)}%
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.avgResponseTime', 'Avg Response Time')}
            </p>
            <h3 className="text-3xl font-bold">{analytics.avgResponseTime}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response Categories Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {t('analytics.responseCategories', 'Response Categories')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                    }}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {t('analytics.sentimentAnalysis', 'Sentiment Analysis')}
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">
                  {analytics.totalResponses.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {sentimentData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Volume Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {t('analytics.responseVolume', 'Response Volume Timeline')}
            </CardTitle>
            <CardDescription>
              {t('analytics.hourlyEngagement', 'Hourly engagement tracking')}
            </CardDescription>
          </div>
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={timelinePeriod === 'hourly' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs shadow-none"
              onClick={() => setTimelinePeriod('hourly')}
            >
              {t('common.hourly', 'Hourly')}
            </Button>
            <Button
              variant={timelinePeriod === 'daily' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs shadow-none"
              onClick={() => setTimelinePeriod('daily')}
            >
              {t('common.daily', 'Daily')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                  }}
                  cursor={{
                    stroke: 'hsl(var(--muted-foreground))',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#F97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  activeDot={{
                    r: 6,
                    fill: '#F97316',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      {analytics.businessInsights && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.businessInsights', 'Business Insights')}
            </CardTitle>
            <CardDescription className="flex items-center justify-between gap-4">
              <span>
                {t(
                  'analytics.businessInsightsDescription',
                  'AI-generated insights from your campaign data',
                )}
              </span>
              {(analytics.analysisCompletedAt ||
                analytics.analysisStartedAt) && (
                <span className="text-xs text-muted-foreground">
                  {t('analytics.generatedAt', 'Generated at')}:{' '}
                  {format(
                    new Date(
                      analytics.analysisCompletedAt ||
                        analytics.analysisStartedAt ||
                        '',
                    ),
                    'PP p',
                  )}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('analytics.mostActiveSender', 'Most Active Sender')}
                </p>
                <p className="font-medium">
                  {analytics.businessInsights.mostActiveSender || '-'}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('analytics.mostCommonCategory', 'Most Common Category')}
                </p>
                <p className="font-medium">
                  {analytics.businessInsights.mostCommonCategory || '-'}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('analytics.dominantSentiment', 'Dominant Sentiment')}
                </p>
                <p className="font-medium capitalize">
                  {analytics.businessInsights.dominantSentiment || '-'}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('analytics.topKeywords', 'Top Keywords')}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analytics.topKeywords.slice(0, 3).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {kw.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// VoIP Analytics Dashboard Component
function VoipAnalyticsDashboard({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation()
  // We can assume enabled here because the component is only rendered if active tab is voip
  const { data: analytics, isLoading } = useVoipAnalytics(campaignId)

  // Transform disposition data for pie chart
  const dispositionData = useMemo(() => {
    if (!analytics?.dispositionBreakdown) return []
    const colors: Record<string, string> = {
      answered: '#22C55E',
      no_answer: '#EAB308',
      busy: '#F97316',
      voicemail: '#3B82F6',
      failed: '#EF4444',
    }
    return Object.entries(analytics.dispositionBreakdown).map(
      ([key, value]) => ({
        name: key.replace('_', ' '),
        value: value as number,
        color: colors[key] || '#6B7280',
      }),
    )
  }, [analytics])

  // Transform hourly volume data
  const hourlyData = useMemo(() => {
    if (!analytics?.hourlyVolume) return []
    return analytics.hourlyVolume.map((item) => ({
      time: `${item.hour}:00`,
      answered: item.answered,
      unanswered: item.unanswered,
      total: item.total,
    }))
  }, [analytics])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {t('common.loading', 'Loading...')}
        </p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 bg-muted rounded-full mb-6 ring-8 ring-muted/50">
          <Phone className="h-12 w-12 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {t('analytics.noVoipData', 'No VoIP Analytics Available')}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {t(
            'analytics.noVoipDataDescription',
            'There is no VoIP call data for this campaign yet.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Phone className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalCalls', 'Total Calls')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.totalCalls.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.answeredCalls', 'Answered Calls')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.answeredCalls.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="font-bold text-orange-500 text-lg">%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.answerRate', 'Answer Rate')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.answerRate.toFixed(2)}%
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.avgCallDuration', 'Avg Call Duration')}
            </p>
            <h3 className="text-3xl font-bold">
              {Math.floor(analytics.summary.avgCallDurationSeconds / 60)}m{' '}
              {analytics.summary.avgCallDurationSeconds % 60}s
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Volume Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('analytics.callVolume', 'Call Volume')}</CardTitle>
            <CardDescription>
              {t('analytics.hourlyCallVolume', 'Hourly call volume breakdown')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="answered"
                    stackId="a"
                    fill="#22C55E"
                    radius={[0, 0, 0, 0]}
                    name="Answered"
                  />
                  <Bar
                    dataKey="unanswered"
                    stackId="a"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    name="Unanswered"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disposition Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.dispositionBreakdown', 'Disposition Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dispositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {dispositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">
                  {analytics.summary.totalCalls}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {dispositionData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="capitalize">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents */}
      {analytics.topAgents && analytics.topAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topAgents', 'Top Agents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.topAgents.slice(0, 6).map((agent, index) => (
                <div key={agent.agentId} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{agent.agentName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Calls</p>
                      <p className="font-medium">{agent.totalCalls}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Answer Rate</p>
                      <p className="font-medium">
                        {agent.answerRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// SMS Analytics Dashboard Component
function SmsAnalyticsDashboard({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation()
  // We can assume enabled here because the component is only rendered if active tab is sms
  const { data: analytics, isLoading } = useSmsAnalytics(campaignId)

  // Transform status data for pie chart
  const statusData = useMemo(() => {
    if (!analytics?.byStatus) return []
    const colors: Record<string, string> = {
      sent: '#22C55E',
      delivered: '#3B82F6',
      failed: '#EF4444',
      pending: '#EAB308',
    }
    return analytics.byStatus.map((item) => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage,
      color: colors[item.status.toLowerCase()] || '#6B7280',
    }))
  }, [analytics])

  // Transform hourly volume data
  const hourlyData = useMemo(() => {
    if (!analytics?.hourlyVolume) return []
    return analytics.hourlyVolume.map((item) => ({
      time: `${item.hour}:00`,
      sent: item.sent,
      failed: item.failed,
      total: item.total,
    }))
  }, [analytics])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {t('common.loading', 'Loading...')}
        </p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 bg-muted rounded-full mb-6 ring-8 ring-muted/50">
          <MessageSquare className="h-12 w-12 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {t('analytics.noSmsData', 'No SMS Analytics Available')}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {t(
            'analytics.noSmsDataDescription',
            'There is no SMS data for this campaign yet.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalMessages', 'Total Messages')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.totalMessages.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalDelivered', 'Total Delivered')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.totalDelivered.toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="font-bold text-orange-500 text-lg">%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.deliveryRate', 'Delivery Rate')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.deliveryRate.toFixed(2)}%
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <span className="font-bold text-purple-500 text-lg">$</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {t('analytics.totalCost', 'Total Cost')}
            </p>
            <h3 className="text-3xl font-bold">
              {analytics.summary.totalCost.toLocaleString()}
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Volume Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {t('analytics.messageVolume', 'Message Volume')}
            </CardTitle>
            <CardDescription>
              {t(
                'analytics.hourlyMessageVolume',
                'Hourly message volume breakdown',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSent)"
                    name="Sent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.statusBreakdown', 'Status Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">
                  {analytics.summary.totalMessages}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {statusData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="capitalize">{item.name}</span>
                  </div>
                  <span className="font-medium">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Masking Breakdown */}
      {analytics.byMasking && analytics.byMasking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.maskingBreakdown', 'By Masking')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.byMasking.map((masking) => (
                <div
                  key={masking.maskingId}
                  className="p-4 bg-muted/50 rounded-lg"
                >
                  <p className="font-medium mb-1">{masking.maskingName}</p>
                  <p className="text-2xl font-bold">
                    {masking.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {masking.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
