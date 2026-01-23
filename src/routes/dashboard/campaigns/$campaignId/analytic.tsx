import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import { useCampaign } from '@/hooks/api/useCampaigns'
import {
  ArrowLeft,
  Calendar,
  Users,
  MessageSquare,
  Phone,
  MessageCircle,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
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
  LineChart,
  Line,
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
import { useHeaderStore } from '@/store/useHeaderStore'
import { useEffect } from 'react'

export const Route = createFileRoute(
  '/dashboard/campaigns/$campaignId/analytic',
)({
  component: CampaignAnalyticsPage,
})

// Mock Data
const responseCategoriesData = [
  { name: 'Interested', value: 1200, color: '#F97316' }, // Orange
  { name: 'Auto-Reply', value: 850, color: '#3B82F6' }, // Blue
  { name: 'Confirmation', value: 600, color: '#22C55E' }, // Green
  { name: 'Thank You', value: 450, color: '#A855F7' }, // Purple
  { name: 'Details', value: 900, color: '#EAB308' }, // Yellow
  { name: 'Unsubscribe', value: 120, color: '#EF4444' }, // Red
]

const sentimentData = [
  { name: 'Positive', value: 65, color: '#22C55E' },
  { name: 'Neutral', value: 25, color: '#EAB308' },
  { name: 'Negative', value: 10, color: '#EF4444' },
]

const timelineData = [
  { time: '00:00', value: 120 },
  { time: '04:00', value: 80 },
  { time: '08:00', value: 450 },
  { time: '12:00', value: 980 },
  { time: '16:00', value: 850 },
  { time: '20:00', value: 340 },
  { time: '23:59', value: 150 },
]

function CampaignAnalyticsPage() {
  const { campaignId } = Route.useParams()
  const { t } = useTranslation()
  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const setCustomContent = useHeaderStore((state) => state.setCustomContent)
  const resetCustomContent = useHeaderStore((state) => state.resetCustomContent)

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
  }, [campaign, setCustomContent, resetCustomContent, t])

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return <div>Error loading campaign</div>
  }

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="space-y-6">
        {/* Redesigned Header Section */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {campaign.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 rounded-md border text-xs font-mono">
                        ID: #{campaign.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
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

                <Button className="bg-orange-500 hover:bg-orange-600 gap-2 h-10 px-6">
                  <ArrowDownRight className="h-4 w-4" />
                  {t('analytics.downloadAnalytics', 'Download Analytics')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <div className="border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger
                value="summary"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none px-0 pb-3 font-medium"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {t('common.summary', 'Summary')}
              </TabsTrigger>
              <TabsTrigger
                value="voip"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none px-0 pb-3 font-medium"
              >
                <Phone className="h-4 w-4 mr-2" />
                {t('services.voip', 'VoIP')}
              </TabsTrigger>
              <TabsTrigger
                value="sms"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none px-0 pb-3 font-medium"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('services.sms', 'SMS')}
              </TabsTrigger>
              <TabsTrigger
                value="whatsapp"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none px-0 pb-3 font-medium"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('services.whatsapp', 'WhatsApp')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="space-y-6 pt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      98.2%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('analytics.totalDelivered', 'Total Delivered')}
                  </p>
                  <h3 className="text-3xl font-bold">12,275</h3>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <ArrowLeft className="h-5 w-5 text-purple-500 rotate-180" />
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      12.5%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('analytics.totalResponses', 'Total Responses')}
                  </p>
                  <h3 className="text-3xl font-bold">4,302</h3>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <span className="font-bold text-orange-500 text-lg">
                        %
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      5.2%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('analytics.responseRate', 'Response Rate')}
                  </p>
                  <h3 className="text-3xl font-bold">35.04%</h3>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-green-500" />
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"
                    >
                      <ArrowDownRight className="h-3 w-3" />
                      2m
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('analytics.avgResponseTime', 'Avg ResponseTime')}
                  </p>
                  <h3 className="text-3xl font-bold">14m 32s</h3>
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Last 7 Days</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={responseCategoriesData}
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
                          }}
                          cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {responseCategoriesData.map((entry, index) => (
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
                      <span className="text-3xl font-bold">4.3k</span>
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
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
                    {t(
                      'analytics.hourlyEngagement',
                      'Hourly engagement tracking',
                    )}
                  </CardDescription>
                </div>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs bg-background shadow-sm hover:bg-background"
                  >
                    {t('common.hourly', 'Hourly')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs hover:bg-background/50"
                  >
                    {t('common.daily', 'Daily')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                        dy={10}
                      />
                      <YAxis
                        tick={{
                          fill: 'hsl(var(--muted-foreground))',
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'calc(var(--radius) - 2px)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                        fill="url(#colorValue)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voip">
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              VoIP Analytics Placeholder
            </div>
          </TabsContent>
          <TabsContent value="sms">
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              SMS Analytics Placeholder
            </div>
          </TabsContent>
          <TabsContent value="whatsapp">
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              WhatsApp Analytics Placeholder
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
