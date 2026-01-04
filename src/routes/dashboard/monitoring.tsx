import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  useRegisteredAgents,
  useActiveCallLogs,
} from '@/hooks/api/useMonitoring'
import { servicesApi } from '@/lib/api/services'
import { ServiceType } from '@/lib/api/types/services.types'
import { decodeJwt } from '@/lib/jwt'
import { getAccessToken } from '@/lib/api/client'
import { apiClient } from '@/lib/api/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Users,
  MonitorSmartphone,
  Phone,
  PhoneCall,
} from 'lucide-react'
import { StandardPagination } from '@/components/common/StandardPagination'
import { format } from 'date-fns'

export const Route = createFileRoute('/dashboard/monitoring')({
  component: MonitoringPage,
  beforeLoad: async () => {
    try {
      // Get user info from token
      const token = getAccessToken()
      if (!token) {
        throw redirect({
          to: '/dashboard',
          search: { error: 'unauthorized' },
        })
      }

      const decodedToken = decodeJwt(token)
      const userId = decodedToken?.sub

      if (!userId) {
        throw redirect({
          to: '/dashboard',
          search: { error: 'unauthorized' },
        })
      }

      // Fetch user to get clientId
      const user = await apiClient.get(`users/${userId}`).json<any>()

      if (!user?.clientId) {
        throw redirect({
          to: '/dashboard',
          search: { error: 'no_client' },
        })
      }

      // Check if VoIP service is enabled
      const enabledServices = await servicesApi.getEnabledServices(
        user.clientId,
      )
      const hasVoipService = enabledServices.some(
        (service) =>
          service.serviceType === ServiceType.VOICE && service.isEnabled,
      )

      if (!hasVoipService) {
        throw redirect({
          to: '/dashboard',
          search: { error: 'voip_not_enabled' },
        })
      }
    } catch (error) {
      // If it's already a redirect, re-throw it
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        throw error
      }

      // Otherwise redirect to dashboard with error
      throw redirect({
        to: '/dashboard',
        search: { error: 'access_denied' },
      })
    }
  },
})

function MonitoringPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('agents')
  const [agentPage, setAgentPage] = useState(1)
  const agentLimit = 10

  // Agent data with pagination
  const {
    data: agentsData,
    isLoading: isLoadingAgents,
    error: agentsError,
  } = useRegisteredAgents({
    page: agentPage,
    limit: agentLimit,
  })

  // Active calls data
  const {
    data: callsData,
    isLoading: isLoadingCalls,
    error: callsError,
  } = useActiveCallLogs()

  const agents = agentsData?.data || []
  const agentsMeta = agentsData?.meta
  const activeCalls = callsData?.data || []

  // Helper to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
      case 'busy':
      case 'incall':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Busy</Badge>
      case 'offline':
        return <Badge className="bg-red-500 hover:bg-red-600">Offline</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>
    }
  }

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('monitoring.title', 'Live Monitoring')}
          </h2>
          <p className="text-muted-foreground">
            {t(
              'monitoring.description',
              'Real-time view of agent activity and connection status.',
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monitoring.totalAgents', 'Total Agents')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentsMeta?.total || agents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monitoring.onlineAgents', 'Online Agents')}
            </CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.status === 'online').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monitoring.activeCalls', 'Active Calls')}
            </CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCalls.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('monitoring.agentTab', 'Agent')}
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {t('monitoring.callTab', 'Call')}
          </TabsTrigger>
        </TabsList>

        {/* Agent Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('monitoring.agentStatus', 'Agent Status')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAgents ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : agentsError ? (
                <div className="flex h-24 items-center justify-center text-destructive">
                  {t('common.error', 'Failed to load data')}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <TableRow>
                          <TableHead className="font-semibold text-primary">
                            {t('monitoring.agentName', 'Agent Name')}
                          </TableHead>
                          <TableHead className="font-semibold text-primary">
                            {t('monitoring.extension', 'Extension')}
                          </TableHead>
                          <TableHead className="font-semibold text-primary">
                            {t('common.role', 'Role')}
                          </TableHead>
                          <TableHead className="font-semibold text-primary">
                            {t('common.email', 'Email')}
                          </TableHead>
                          <TableHead className="font-semibold text-primary">
                            {t('common.status', 'Status')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {t(
                                'monitoring.noAgents',
                                'No active agents found',
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          agents.map((agent) => (
                            <TableRow key={agent.extension}>
                              <TableCell className="font-medium">
                                {agent.user.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {agent.extension}
                                </Badge>
                              </TableCell>
                              <TableCell className="capitalize">
                                {agent.user.role}
                              </TableCell>
                              <TableCell>{agent.user.email}</TableCell>
                              <TableCell>
                                {getStatusBadge(agent.status)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {agentsMeta && (
                    <StandardPagination
                      currentPage={agentPage}
                      totalPages={agentsMeta.totalPages}
                      totalItems={agentsMeta.total}
                      itemsPerPage={agentLimit}
                      onPageChange={setAgentPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Tab */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('monitoring.activeCalls', 'Active Calls')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCalls ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : callsError ? (
                <div className="flex h-24 items-center justify-center text-destructive">
                  {t('common.error', 'Failed to load data')}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                      <TableRow>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.agent', 'Agent')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.phoneNumber', 'Phone Number')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.campaign', 'Campaign')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.lead', 'Lead')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.startTime', 'Start Time')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('monitoring.duration', 'Duration')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCalls.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-24 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Phone className="h-8 w-8" />
                              {t('monitoring.noActiveCalls', 'No active calls')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        activeCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell className="font-medium">
                              {call.agent?.name || '-'}
                            </TableCell>
                            <TableCell>{call.phoneNumber}</TableCell>
                            <TableCell>{call.campaign?.name || '-'}</TableCell>
                            <TableCell>{call.lead?.leadName || '-'}</TableCell>
                            <TableCell>
                              {call.startTime
                                ? format(new Date(call.startTime), 'HH:mm:ss')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {formatDuration(call.duration)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
