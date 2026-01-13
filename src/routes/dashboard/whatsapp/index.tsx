import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  Loader2,
} from 'lucide-react'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useWhatsAppInstances,
  useCreateWhatsAppInstance,
  useDeleteWhatsAppInstance,
  useConnectWhatsAppInstance,
  useWhatsAppQR,
  useWhatsAppMediaSize,
} from '@/hooks/api/useWhatsapp'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/whatsapp/')({
  component: WhatsAppManagementPage,
})

const createInstanceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type CreateInstanceFormValues = z.infer<typeof createInstanceSchema>

function MediaSizeDisplay({ instanceId }: { instanceId: string }) {
  const { data: mediaSize, isLoading } = useWhatsAppMediaSize(instanceId)

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
  return <span>{mediaSize?.totalSizeFormatted || '0 B'}</span>
}

function WhatsAppManagementPage(): React.ReactElement {
  const { t } = useTranslation()
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [connectStep, setConnectStep] = useState<1 | 2>(1)
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(
    null,
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null)

  const { data: instances, isLoading } = useWhatsAppInstances()
  const { data: qrData, isLoading: isQrLoading } =
    useWhatsAppQR(createdInstanceId)
  const createInstanceMutation = useCreateWhatsAppInstance()
  const connectInstanceMutation = useConnectWhatsAppInstance()
  const deleteInstanceMutation = useDeleteWhatsAppInstance()
  const queryClient = useQueryClient()

  const form = useForm<CreateInstanceFormValues>({
    resolver: zodResolver(createInstanceSchema),
    defaultValues: {
      name: '',
    },
  })

  // Auto-close modal when connected
  useEffect(() => {
    if (qrData?.status === 'connected') {
      toast.success(t('whatsapp.connected', 'WhatsApp connected successfully!'))
      setIsConnectOpen(false)
      setCreatedInstanceId(null)
      setConnectStep(1)
      // Refresh instances list
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'instances'] })
    }
  }, [qrData?.status, t, queryClient])

  const hasInstances = instances && instances.length > 0

  const totalAccounts = instances?.length || 0
  const activeConnections =
    instances?.filter((a) => a.status === 'connected').length || 0
  const totalSent =
    instances?.reduce((sum, a) => sum + (a._count?.messages || 0), 0) || 0 // Revisit logic if sent/received separated in future
  const totalReceived =
    instances?.reduce((sum, a) => sum + (a._count?.messages || 0), 0) || 0 // Placeholder logic as per mock structure

  const handleOpenConnect = () => {
    setConnectStep(1)
    setCreatedInstanceId(null)
    form.reset()
    setIsConnectOpen(true)
  }

  const handleCreateInstance = (values: CreateInstanceFormValues) => {
    createInstanceMutation.mutate(
      {
        name: values.name,
        providerType: 'baileys',
      },
      {
        onSuccess: (data) => {
          // Chain connect request
          connectInstanceMutation.mutate(data.id, {
            onSuccess: () => {
              setCreatedInstanceId(data.id)
              setConnectStep(2)
              toast.success(
                t(
                  'whatsapp.createSuccess',
                  'Instance created and connecting...',
                ),
              )
            },
            onError: () => {
              toast.error(
                t(
                  'whatsapp.connectError',
                  'Instance created but failed to connect',
                ),
              )
            },
          })
        },
        onError: () => {
          toast.error(t('whatsapp.createError', 'Failed to create instance'))
        },
      },
    )
  }

  const handleReconnect = (id: string): void => {
    setCreatedInstanceId(id)
    connectInstanceMutation.mutate(id, {
      onSuccess: () => {
        setConnectStep(2)
        setIsConnectOpen(true)
        toast.info(t('whatsapp.reconnecting', 'Initiating reconnection...'))
      },
      onError: () => {
        toast.error(
          t('whatsapp.reconnectError', 'Failed to initiate reconnection'),
        )
        setCreatedInstanceId(null)
      },
    })
  }

  const handleDeleteInstance = (id: string): void => {
    setInstanceToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = (): void => {
    if (!instanceToDelete) return

    deleteInstanceMutation.mutate(instanceToDelete, {
      onSuccess: () => {
        toast.success(t('common.deleteSuccess', 'Item deleted successfully'))
        setDeleteDialogOpen(false)
        setInstanceToDelete(null)
      },
      onError: () => {
        toast.error(t('common.deleteError', 'Failed to delete item'))
      },
    })
  }

  const isCreating =
    createInstanceMutation.isPending || connectInstanceMutation.isPending

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['admin', 'supervisor']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RoleGuard>
    )
  }

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
          {hasInstances && (
            <Button className="w-full sm:w-auto" onClick={handleOpenConnect}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {t('whatsapp.connectNew', 'Connect New Account')}
              </span>
              <span className="sm:hidden">
                {t('whatsapp.connectNewShort', 'Connect')}
              </span>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {hasInstances && (
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
                    {t(
                      'whatsapp.stats.activeConnections',
                      'Active Connections',
                    )}
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
                  {/* Note: Using total messages count as placeholder since split counts not in new type */}
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
                  {/* Note: Using total messages count as placeholder since split counts not in new type */}
                  {totalReceived.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Accounts Section */}
        {hasInstances && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold">
                {t('whatsapp.connectedAccounts', 'Connected Accounts')}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((account) => (
                <Card key={account.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          account.providerType === 'official'
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
                              : t(
                                  'whatsapp.status.disconnected',
                                  'Disconnected',
                                )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {account.phoneNumber || '-'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {account.providerType === 'official'
                              ? t('whatsapp.type.official', 'Official API')
                              : t(
                                  'whatsapp.type.unofficial',
                                  'Unofficial / Web',
                                )}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('whatsapp.messages', 'Messages')}
                        </p>
                        <p className="text-lg font-bold">
                          {account._count?.messages?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('whatsapp.storage', 'Storage')}
                        </p>
                        <p className="text-sm font-bold">
                          <MediaSizeDisplay instanceId={account.id} />
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        to="/dashboard/whatsapp/details/$instanceId"
                        params={{ instanceId: account.id }}
                        className="flex-1"
                      >
                        <Button variant="default" size="sm" className="w-full">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {t('whatsapp.messages', 'Messages')}
                        </Button>
                      </Link>
                      {account.status === 'disconnected' &&
                      account.providerType === 'baileys' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReconnect(account.id)}
                          disabled={
                            connectInstanceMutation.isPending &&
                            createdInstanceId === account.id
                          }
                        >
                          {connectInstanceMutation.isPending &&
                          createdInstanceId === account.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          {t('whatsapp.reconnect', 'Reconnect')}
                        </Button>
                      ) : (
                        <Link
                          to="/dashboard/whatsapp/setting/$id"
                          params={{ id: account.id }}
                        >
                          <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteInstance(account.id)}
                        disabled={deleteInstanceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Connect Another Account Card */}
              <Card
                className="border-dashed hover:border-primary/50 transition-colors cursor-pointer"
                onClick={handleOpenConnect}
              >
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
        )}

        {/* Connection Options Section - Always show */}
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
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenConnect}
                  >
                    {t('whatsapp.qrCode.button', 'Connect via QR Code')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Modal */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {connectStep === 1
                ? t('whatsapp.connect.step1Title', 'Connect WhatsApp')
                : t('whatsapp.connect.step2Title', 'Scan QR Code')}
            </DialogTitle>
            <DialogDescription>
              {connectStep === 1
                ? t(
                    'whatsapp.connect.step1Desc',
                    'Enter a name for this WhatsApp connection.',
                  )
                : t(
                    'whatsapp.connect.step2Desc',
                    'Scan the QR code to link your account.',
                  )}
            </DialogDescription>
          </DialogHeader>

          {connectStep === 1 ? (
            <div className="space-y-4 py-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateInstance)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('whatsapp.connect.instanceName', 'Instance Name')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sales Support" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('common.next', 'Next')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg border border-border">
                {/* QR Code Display */}
                <div className="bg-white p-2 rounded-lg shadow-sm min-h-[200px] flex items-center justify-center">
                  {isQrLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t('whatsapp.connect.detecting', 'Generating QR...')}
                      </span>
                    </div>
                  ) : qrData?.qrCode ? (
                    <img
                      src={qrData.qrCode}
                      alt="Scan QR Code"
                      className="w-[200px] h-[200px] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t(
                          'whatsapp.connect.waitingQR',
                          'Waiting for QR Code...',
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {t('whatsapp.connect.waitingScan', 'Waiting for scan...')}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t('whatsapp.connect.instructions', 'Instructions')}
                </h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <span className="text-muted-foreground">
                      {t(
                        'whatsapp.connect.step1',
                        'Open WhatsApp on your phone',
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <span className="text-muted-foreground">
                      {/* This could be refined with bold text for Menu/Settings */}
                      {t(
                        'whatsapp.connect.step2',
                        'Tap Menu or Settings and select Linked Devices',
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <span className="text-muted-foreground">
                      {t(
                        'whatsapp.connect.step3',
                        'Point your phone to this screen to capture the code',
                      )}
                    </span>
                  </li>
                </ol>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsConnectOpen(false)}
                >
                  {t('common.close', 'Close')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.confirmDeleteTitle', 'Are you sure?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'whatsapp.deleteDescription',
                'This will permanently delete the WhatsApp instance and all its data. This action cannot be undone.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInstanceMutation.isPending}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteInstanceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInstanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}
