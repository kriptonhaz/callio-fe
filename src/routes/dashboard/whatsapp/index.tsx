import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle,
  Send,
  MessageSquare,
  Users,
  QrCode,
  Check,
} from 'lucide-react'
import { RoleGuard } from '@/lib/auth-guard'

// Mock data for WhatsApp accounts
interface WhatsAppAccount {
  id: string
  name: string
  phoneNumber: string
  status: 'connected' | 'disconnected'
  type: 'official' | 'unofficial'
  lastActiveAt: string
  sentCount: number
  receivedCount: number
}

const mockWhatsAppAccounts: WhatsAppAccount[] = [
  {
    id: '1',
    name: 'Customer Support',
    phoneNumber: '+62 812-3456-7890',
    status: 'connected',
    type: 'official',
    lastActiveAt: '2m ago',
    sentCount: 8432,
    receivedCount: 5109,
  },
  {
    id: '2',
    name: 'Marketing Team',
    phoneNumber: '+62 899-7654-3210',
    status: 'disconnected',
    type: 'unofficial',
    lastActiveAt: '4h ago',
    sentCount: 2110,
    receivedCount: 943,
  },
]

export const Route = createFileRoute('/dashboard/whatsapp/')({
  component: WhatsAppManagementPage,
})

function WhatsAppManagementPage(): React.ReactElement {
  const { t } = useTranslation()
  const [accounts] = useState<WhatsAppAccount[]>(mockWhatsAppAccounts)

  // Calculate stats
  const totalAccounts = accounts.length
  const activeConnections = accounts.filter(
    (a) => a.status === 'connected',
  ).length
  const totalSent = accounts.reduce((sum, a) => sum + a.sentCount, 0)
  const totalReceived = accounts.reduce((sum, a) => sum + a.receivedCount, 0)

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t('whatsapp.title', 'WhatsApp Management')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(
                'whatsapp.description',
                'Manage your official and unofficial WhatsApp connections.',
              )}
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {t('whatsapp.connectNew', 'Connect New Account')}
            </span>
            <span className="sm:hidden">
              {t('whatsapp.connectNewShort', 'Connect')}
            </span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {t('whatsapp.stats.totalAccounts', 'Total Accounts')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {totalAccounts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">
                  {t('whatsapp.stats.activeConnections', 'Active Connections')}
                </span>
                <span className="sm:hidden">
                  {t('whatsapp.stats.active', 'Active')}
                </span>
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {activeConnections}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">
                  {t('whatsapp.stats.messagesSent', 'Messages Sent (24h)')}
                </span>
                <span className="sm:hidden">
                  {t('whatsapp.stats.sent', 'Sent')}
                </span>
              </CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {totalSent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">
                  {t('whatsapp.stats.messagesReceived', 'Messages Received')}
                </span>
                <span className="sm:hidden">
                  {t('whatsapp.stats.received', 'Received')}
                </span>
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {totalReceived.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">
              {t('whatsapp.connectedAccounts', 'Connected Accounts')}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        account.type === 'official'
                          ? 'bg-green-500'
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}
                    >
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">
                          {account.name}
                        </h3>
                        <Badge
                          variant={
                            account.status === 'connected'
                              ? 'default'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {account.status === 'connected'
                            ? t('whatsapp.status.connected', 'Connected')
                            : t('whatsapp.status.disconnected', 'Disconnected')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {account.phoneNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {account.type === 'official'
                            ? t('whatsapp.type.official', 'Official API')
                            : t('whatsapp.type.unofficial', 'Unofficial / Web')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          •{' '}
                          {account.status === 'connected'
                            ? t('whatsapp.lastActive', 'Last active {{time}}', {
                                time: account.lastActiveAt,
                              })
                            : t(
                                'whatsapp.disconnected',
                                'Disconnected {{time}}',
                                { time: account.lastActiveAt },
                              )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('whatsapp.sent', 'Sent')}
                      </p>
                      <p className="text-lg font-bold">
                        {account.sentCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('whatsapp.received', 'Received')}
                      </p>
                      <p className="text-lg font-bold">
                        {account.receivedCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    {account.status === 'disconnected' ? (
                      <Button size="sm" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {t('whatsapp.reconnect', 'Reconnect')}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        {t('common.settings', 'Settings')}
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Connect Another Account Card */}
            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">
                  {t('whatsapp.connectAnother', 'Connect Another Account')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    'whatsapp.connectAnotherDesc',
                    'Scale your business communication',
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Connection Options Section */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">
                {t('whatsapp.growTitle', 'Grow your reach with WhatsApp')}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t(
                  'whatsapp.growDesc',
                  'Choose the best connection method for your business needs. We support both official API and session-based connections.',
                )}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Official API Option */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 md:p-6">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {t(
                      'whatsapp.officialApi.title',
                      'Connect Official WhatsApp API',
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t(
                      'whatsapp.officialApi.desc',
                      "Best for enterprises. High reliability, official green tick support, and limitless messaging capability through Meta's official infrastructure.",
                    )}
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t(
                        'whatsapp.officialApi.feature1',
                        'Unlimited message volume',
                      )}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t(
                        'whatsapp.officialApi.feature2',
                        'Official Green Tick possible',
                      )}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t(
                        'whatsapp.officialApi.feature3',
                        '99.9% uptime guarantee',
                      )}
                    </li>
                  </ul>
                  <Button className="w-full">
                    {t('whatsapp.officialApi.button', 'Start API Onboarding')}
                  </Button>
                </CardContent>
              </Card>

              {/* QR Code Option */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 md:p-6">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {t('whatsapp.qrCode.title', 'Connect via QR Code')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t(
                      'whatsapp.qrCode.desc',
                      'Instant setup. Connect any regular or business WhatsApp account by scanning a QR code, just like WhatsApp Web.',
                    )}
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t(
                        'whatsapp.qrCode.feature1',
                        'Setup in less than 30 seconds',
                      )}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t('whatsapp.qrCode.feature2', 'Support for group chats')}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {t(
                        'whatsapp.qrCode.feature3',
                        'No Meta Approval required',
                      )}
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">
                    {t('whatsapp.qrCode.button', 'Connect via QR Code')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
