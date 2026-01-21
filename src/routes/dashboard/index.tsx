import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { VoipAnalyticsDashboard } from '@/components/dashboard/VoipAnalyticsDashboard'
import { SmsAnalyticsDashboard } from '@/components/dashboard/SmsAnalyticsDashboard'
import {
  DateRangeProvider,
  DateRangeFilter,
} from '@/components/dashboard/DateRangeFilter'
import { Button } from '@/components/ui/button'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useMe } from '@/hooks/api/useAuth'
import { ServiceType } from '@/lib/api/types/services.types'
import { useTranslation } from 'react-i18next'
import { Phone, MessageSquare } from 'lucide-react'
import { RoleGuard } from '@/lib/auth-guard'

type ServiceTab = 'voip' | 'sms'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  const { t } = useTranslation()
  const { data: me, isLoading: isMeLoading } = useMe()
  const clientId = me?.clientId
  const navigate = useNavigate()

  // Redirect agents to campaigns page - they don't have dashboard access
  useEffect(() => {
    if (!isMeLoading && me?.role === 'agent') {
      navigate({ to: '/dashboard/campaigns', search: { page: 1, limit: 10 } })
    }
  }, [me?.role, isMeLoading, navigate])

  // Check which services are enabled
  const { data: enabledServices } = useEnabledServices(clientId)
  const isVoipEnabled = enabledServices?.some(
    (s) => s.serviceType === ServiceType.VOICE,
  )
  const isSmsEnabled = enabledServices?.some(
    (s) => s.serviceType === ServiceType.SMS,
  )

  // Determine default tab
  const defaultTab: ServiceTab = isVoipEnabled
    ? 'voip'
    : isSmsEnabled
      ? 'sms'
      : 'voip'
  const [activeTab, setActiveTab] = useState<ServiceTab>(defaultTab)

  // Show nothing while loading or if agent (will redirect)
  if (isMeLoading || me?.role === 'agent') {
    return null
  }

  return (
    <RoleGuard allowedRoles={['superadmin', 'admin', 'supervisor']}>
      <DateRangeProvider>
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header with Date Range Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              {t('dashboard.title')}
            </h2>
            <DateRangeFilter />
          </div>

          {/* Service Analytics Tabs - Segmented Control Style */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1 w-fit">
              {isVoipEnabled !== false && (
                <Button
                  variant={activeTab === 'voip' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('voip')}
                  className="h-8 gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {t('dashboard.voipAnalytics', 'VoIP Analytics')}
                </Button>
              )}
              {isSmsEnabled && (
                <Button
                  variant={activeTab === 'sms' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('sms')}
                  className="h-8 gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('dashboard.smsAnalytics', 'SMS Analytics')}
                </Button>
              )}
            </div>

            {/* VoIP Analytics Content */}
            {activeTab === 'voip' && isVoipEnabled !== false && (
              <VoipAnalyticsDashboard />
            )}

            {/* SMS Analytics Content */}
            {activeTab === 'sms' && isSmsEnabled && <SmsAnalyticsDashboard />}
          </div>
        </div>
      </DateRangeProvider>
    </RoleGuard>
  )
}
