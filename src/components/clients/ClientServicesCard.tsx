import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, MessageSquare, MessageCircle, AlertCircle } from 'lucide-react'
import type { ClientService } from '@/lib/api/types/services.types'
import { ServiceType } from '@/lib/api/types/services.types'
import { cn } from '@/lib/utils'

interface ClientServicesCardProps {
  services: ClientService[]
  isLoading?: boolean
}

export function ClientServicesCard({
  services,
  isLoading = false,
}: ClientServicesCardProps) {
  const { t } = useTranslation()

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.VOICE:
        return <Phone className="h-5 w-5 text-blue-500" />
      case ServiceType.SMS:
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case ServiceType.WHATSAPP:
        return <MessageCircle className="h-5 w-5 text-green-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case ServiceType.VOICE:
        return t('services.voice', 'Voice')
      case ServiceType.SMS:
        return t('services.sms', 'SMS')
      case ServiceType.WHATSAPP:
        return t('services.whatsapp', 'WhatsApp')
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
        <CardTitle>{t('clients.services.title', 'Active Services')}</CardTitle>
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
                      <div className="font-medium">
                        {getServiceLabel(service.serviceType)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {service.isEnabled
                          ? t('common.enabled', 'Enabled')
                          : t('common.disabled', 'Disabled')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {service.expiresAt ? (
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
    </Card>
  )
}
