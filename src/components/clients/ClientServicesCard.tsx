import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Phone,
  MessageSquare,
  MessageCircle,
  AlertCircle,
  Edit,
  Plus,
  BrainCircuit,
  Mail,
} from 'lucide-react'
import type { ClientService } from '@/lib/api/types/services.types'
import type { ClientServiceBalance } from '@/lib/api/types/balance.types'
import { ServiceType } from '@/lib/api/types/services.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { EditClientServicesModal } from './EditClientServicesModal'
import { TopUpServiceModal } from './TopUpServiceModal'

interface ClientServicesCardProps {
  clientId: string
  services: ClientService[]
  balances?: ClientServiceBalance[]
  isLoading?: boolean
}

export function ClientServicesCard({
  clientId,
  services,
  balances = [],
  isLoading = false,
}: ClientServicesCardProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [topUpModalOpen, setTopUpModalOpen] = useState(false)
  const [selectedServiceForTopUp, setSelectedServiceForTopUp] =
    useState<ServiceType | null>(null)

  const getServiceIcon = (type: ServiceType | string) => {
    switch (type) {
      case ServiceType.VOICE:
        return <Phone className="h-5 w-5 text-blue-500" />
      case ServiceType.SMS:
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case ServiceType.WHATSAPP:
        return <MessageCircle className="h-5 w-5 text-green-600" />
      case ServiceType.AI:
        return <BrainCircuit className="h-5 w-5 text-purple-500" />
      case ServiceType.EMAIL:
        return <Mail className="h-5 w-5 text-orange-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getServiceLabel = (type: ServiceType | string) => {
    switch (type) {
      case ServiceType.VOICE:
        return t('services.voice', 'Voice')
      case ServiceType.SMS:
        return t('services.sms', 'SMS')
      case ServiceType.WHATSAPP:
        return t('services.whatsapp', 'WhatsApp')
      case ServiceType.AI:
        return t('services.ai', 'AI')
      case ServiceType.EMAIL:
        return t('services.email', 'Email')
      default:
        return type
    }
  }

  const calculateDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleTopUpClick = (type: ServiceType) => {
    setSelectedServiceForTopUp(type)
    setTopUpModalOpen(true)
  }

  // Find balance for the currently selected service for top up
  const selectedServiceBalance = selectedServiceForTopUp
    ? balances.find((b) => b.serviceType === selectedServiceForTopUp)
    : undefined

  const formatBalance = (balance: ClientServiceBalance['balance']) => {
    if (!balance) return '0'

    if (balance.unit === 'TOKENS') {
      return `${(balance.balanceTokens ?? 0).toLocaleString()} Tokens`
    }

    // Default to Currency (IDR)
    return `${balance.currency} ${Number(balance.balanceAmount ?? 0).toLocaleString()}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t('clients.services.title', 'Active Services')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <span className="text-muted-foreground text-sm">
              {t('common.loading', 'Loading...')}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('clients.services.title', 'Active Services')}</span>
          <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            {t('clients.services.noServices', 'No active services found')}
          </div>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => {
              const daysRemaining = service.expiresAt
                ? calculateDaysRemaining(service.expiresAt)
                : null
              const isExpired = daysRemaining !== null && daysRemaining < 0

              // Find balance for this service
              const serviceBalance = balances.find(
                (b) => b.serviceType === service.serviceType,
              )

              return (
                <div
                  key={service.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3',
                    !service.isEnabled && 'bg-muted/50 opacity-60',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-background rounded-full p-2 shadow-sm">
                      {getServiceIcon(service.serviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getServiceLabel(service.serviceType)}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            service.subscriptionType === 'prepaid'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                          )}
                        >
                          {service.subscriptionType === 'prepaid'
                            ? t('services.prepaid', 'Prepaid')
                            : t('services.postpaid', 'Postpaid')}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {service.isEnabled
                          ? t('common.enabled', 'Enabled')
                          : t('common.disabled', 'Disabled')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {/* Show balance for prepaid services */}
                    {service.subscriptionType === 'prepaid' ? (
                      <div className="flex items-center gap-3">
                        {serviceBalance?.balance && (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">
                              {t('services.balance', 'Balance')}
                            </span>
                            <span className="text-sm font-medium">
                              {formatBalance(serviceBalance.balance)}
                            </span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title={t('services.topUp', 'Top Up')}
                          onClick={() =>
                            handleTopUpClick(service.serviceType as ServiceType)
                          }
                          disabled={!service.isEnabled}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : service.expiresAt ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">
                          {t('common.expires', 'Expires')}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isExpired ? 'text-red-500' : 'text-foreground',
                          )}
                        >
                          {new Date(service.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('clients.services.noExpiry', 'No Expiry')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      <EditClientServicesModal
        clientId={clientId}
        services={services}
        balances={balances}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <TopUpServiceModal
        clientId={clientId}
        serviceType={selectedServiceForTopUp}
        currentBalance={
          selectedServiceBalance?.balance?.balanceAmount ??
          selectedServiceBalance?.balance?.balanceTokens ??
          0
        }
        currency={selectedServiceBalance?.balance?.currency}
        unit={selectedServiceBalance?.balance?.unit}
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
      />
    </Card>
  )
}
