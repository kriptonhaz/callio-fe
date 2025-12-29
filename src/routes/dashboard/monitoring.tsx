import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useRegisteredAgents } from '@/hooks/api/useMonitoring'
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
import { Loader2, Users, MonitorSmartphone } from 'lucide-react'

export const Route = createFileRoute('/dashboard/monitoring')({
  component: MonitoringPage,
})

function MonitoringPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useRegisteredAgents()

  const agents = data?.registered || []

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monitoring.totalAgents', 'Total Agents')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.agentStatus', 'Agent Status')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-24 items-center justify-center text-destructive">
              {t('common.error', 'Failed to load data')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t('monitoring.agentName', 'Agent Name')}
                  </TableHead>
                  <TableHead>
                    {t('monitoring.extension', 'Extension')}
                  </TableHead>
                  <TableHead>{t('common.role', 'Role')}</TableHead>
                  <TableHead>{t('common.email', 'Email')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t('monitoring.noAgents', 'No active agents found')}
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
                      <TableCell>{getStatusBadge(agent.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
