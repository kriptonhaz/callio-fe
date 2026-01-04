import { useState, useEffect } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  useRegisteredAgents,
  useActiveCallLogs,
  useStartCallMonitor,
  useStopCallMonitor,
} from '@/hooks/api/useMonitoring'
import { useSipCredentials } from '@/hooks/api/useSipExtensions'
import { useSipStore } from '@/store/useSipStore'
import { servicesApi } from '@/lib/api/services'
import { ServiceType } from '@/lib/api/types/services.types'
import type { ActiveCall, MonitorMode } from '@/lib/api/types/monitoring.types'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  Users,
  MonitorSmartphone,
  Phone,
  PhoneCall,
  PhoneIncoming,
  MoreHorizontal,
  Eye,
  MessageSquare,
  PhoneOff,
} from 'lucide-react'
import { StandardPagination } from '@/components/common/StandardPagination'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

  // Monitoring dialog state
  const [monitoringCall, setMonitoringCall] = useState<ActiveCall | null>(null)
  const [monitoringMode, setMonitoringMode] = useState<MonitorMode | null>(null)
  const [isMonitoringDialogOpen, setIsMonitoringDialogOpen] = useState(false)
  // Phase: 'waiting' = waiting for incoming call, 'ringing' = incoming call arrived, 'connected' = call answered
  const [monitoringPhase, setMonitoringPhase] = useState<
    'waiting' | 'ringing' | 'connected'
  >('waiting')

  // SIP store for incoming call handling
  const incomingCall = useSipStore((state) => state.incomingCall)
  const callStatus = useSipStore((state) => state.callStatus)
  const acceptIncomingCall = useSipStore((state) => state.acceptIncomingCall)
  const hangup = useSipStore((state) => state.hangup)

  // SIP credentials for supervisor extension
  const { data: sipCredentials } = useSipCredentials()

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

  // Monitoring mutations
  const { mutate: startMonitor, isPending: isStartingMonitor } =
    useStartCallMonitor()
  const { mutate: stopMonitor, isPending: isStoppingMonitor } =
    useStopCallMonitor()

  const agents = agentsData?.data || []
  const agentsMeta = agentsData?.meta
  const activeCalls = callsData?.data || []

  // Watch for incoming call when monitoring is active
  useEffect(() => {
    if (
      isMonitoringDialogOpen &&
      monitoringPhase === 'waiting' &&
      incomingCall
    ) {
      // Incoming call arrived while waiting for monitoring callback
      setMonitoringPhase('ringing')
    }
  }, [isMonitoringDialogOpen, monitoringPhase, incomingCall])

  // Watch for call status changes
  useEffect(() => {
    if (isMonitoringDialogOpen && callStatus === 'active') {
      setMonitoringPhase('connected')
    } else if (isMonitoringDialogOpen && callStatus === 'ended') {
      // Call ended, close monitoring
      setIsMonitoringDialogOpen(false)
      setMonitoringCall(null)
      setMonitoringMode(null)
      setMonitoringPhase('waiting')
    }
  }, [isMonitoringDialogOpen, callStatus])

  // Handle start monitoring
  const handleStartMonitoring = (call: ActiveCall, mode: MonitorMode): void => {
    if (!sipCredentials?.extension) {
      toast.error(
        t('monitoring.noSipExtension', 'You do not have a SIP extension'),
      )
      return
    }

    startMonitor(
      {
        callLogId: call.id,
        data: {
          mode,
          supervisorExtension: sipCredentials.extension,
        },
      },
      {
        onSuccess: () => {
          setMonitoringCall(call)
          setMonitoringMode(mode)
          setMonitoringPhase('waiting')
          setIsMonitoringDialogOpen(true)
          toast.success(
            t('monitoring.waitingForCall', 'Waiting for incoming call...'),
          )
        },
        onError: () => {
          toast.error(
            t('monitoring.monitoringFailed', 'Failed to start monitoring'),
          )
        },
      },
    )
  }

  // Handle accepting the incoming monitoring call
  const handleAcceptMonitoringCall = (): void => {
    acceptIncomingCall()
    setMonitoringPhase('connected')
  }

  // Handle stop monitoring
  const handleStopMonitoring = (): void => {
    if (!monitoringCall) return

    // Hangup the SIP call first
    hangup()

    stopMonitor(monitoringCall.id, {
      onSuccess: () => {
        setIsMonitoringDialogOpen(false)
        setMonitoringCall(null)
        setMonitoringMode(null)
        setMonitoringPhase('waiting')
        toast.success(t('monitoring.monitoringStopped', 'Monitoring stopped'))
      },
      onError: () => {
        toast.error(
          t('monitoring.stopMonitoringFailed', 'Failed to stop monitoring'),
        )
      },
    })
  }

  // Handle dialog close
  const handleDialogClose = (open: boolean): void => {
    if (!open && monitoringCall) {
      handleStopMonitoring()
    }
  }

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
                          {t('monitoring.status', 'Status')}
                        </TableHead>
                        <TableHead className="font-semibold text-primary">
                          {t('common.actions', 'Actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCalls.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
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
                              <div className="flex flex-col">
                                <span>{call.agent.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Ext: {call.agent.sipExtension}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{call.phoneNumber}</TableCell>
                            <TableCell>{call.campaign.name}</TableCell>
                            <TableCell>{call.lead.leadName}</TableCell>
                            <TableCell>
                              {call.startTime
                                ? format(new Date(call.startTime), 'HH:mm:ss')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500 hover:bg-green-600">
                                {call.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStartMonitoring(call, 'spy')
                                    }
                                    disabled={isStartingMonitor}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('monitoring.spying', 'Spying')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStartMonitoring(call, 'whisper')
                                    }
                                    disabled={isStartingMonitor}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t('monitoring.coaching', 'Coaching')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStartMonitoring(call, 'barge')
                                    }
                                    disabled={isStartingMonitor}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t('monitoring.barge', 'Join Call')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Monitoring Dialog */}
      <Dialog open={isMonitoringDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {monitoringPhase === 'ringing' ? (
                <>
                  <PhoneIncoming className="h-5 w-5 animate-pulse text-green-500" />
                  {t('monitoring.incomingCall', 'Incoming Monitoring Call')}
                </>
              ) : monitoringMode === 'spy' ? (
                <>
                  <Eye className="h-5 w-5" />
                  {t('monitoring.spyingTitle', 'Spying on Call')}
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  {t('monitoring.coachingTitle', 'Coaching Call')}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {monitoringPhase === 'waiting'
                ? t(
                    'monitoring.waitingDescription',
                    'Waiting for Asterisk to call your extension...',
                  )
                : monitoringPhase === 'ringing'
                  ? t(
                      'monitoring.answerToListen',
                      'Answer the call to start listening.',
                    )
                  : monitoringMode === 'spy'
                    ? t(
                        'monitoring.spyingDescription',
                        'You are listening to this call. The agent and customer cannot hear you.',
                      )
                    : t(
                        'monitoring.coachingDescription',
                        'You can speak to the agent. The customer cannot hear you.',
                      )}
            </DialogDescription>
          </DialogHeader>

          {monitoringCall && (
            <div className="space-y-4">
              {/* Call Info Card */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('monitoring.campaign', 'Campaign')}
                  </span>
                  <span className="font-medium">
                    {monitoringCall.campaign.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('monitoring.lead', 'Lead')}
                  </span>
                  <span className="font-medium">
                    {monitoringCall.lead.leadName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('monitoring.agent', 'Agent')}
                  </span>
                  <span className="font-medium">
                    {monitoringCall.agent.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('monitoring.phoneNumber', 'Phone Number')}
                  </span>
                  <span className="font-medium">
                    {monitoringCall.phoneNumber}
                  </span>
                </div>
              </div>

              {/* Actions based on phase */}
              <div className="flex justify-center gap-3 pt-2">
                {monitoringPhase === 'waiting' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {t('monitoring.callingYou', 'Calling your extension...')}
                    </span>
                  </div>
                )}

                {monitoringPhase === 'ringing' && (
                  <>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="gap-2"
                      onClick={handleStopMonitoring}
                    >
                      <PhoneOff className="h-4 w-4" />
                      {t('common.reject', 'Reject')}
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="gap-2 bg-green-500 hover:bg-green-600"
                      onClick={handleAcceptMonitoringCall}
                    >
                      <Phone className="h-4 w-4" />
                      {t('common.answer', 'Answer')}
                    </Button>
                  </>
                )}

                {monitoringPhase === 'connected' && (
                  <Button
                    variant="destructive"
                    size="lg"
                    className="gap-2"
                    onClick={handleStopMonitoring}
                    disabled={isStoppingMonitor}
                  >
                    {isStoppingMonitor ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PhoneOff className="h-4 w-4" />
                    )}
                    {t('monitoring.hangup', 'Hang Up')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
