import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useClient, useDeleteClient } from '@/hooks/api/useClients'
import { useUsers } from '@/hooks/api/useUsers'
import { usePaymentHistory } from '@/hooks/api/useRemainingModules'
import { useClientPricing } from '@/hooks/api/usePricing'
import { useClientServices } from '@/hooks/api/useServices'
import { useClientBalanceSummary } from '@/hooks/api/useBalance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react'
import { ClientStatus } from '@/lib/api/types/clients.types'
import { SubscriptionCard } from '@/components/clients/SubscriptionCard'
import { PaymentHistoryTable } from '@/components/clients/PaymentHistoryTable'
import { ClientUsersTable } from '@/components/clients/ClientUsersTable'
import { ClientPricingTable } from '@/components/clients/ClientPricingTable'
import { ClientServicesCard } from '@/components/clients/ClientServicesCard'
import { SipExtensionRangeCard } from '@/components/clients/SipExtensionRangeCard'
import { SmsMaskingCard } from '@/components/clients/SmsMaskingCard'
import { IpWhitelistCard } from '@/components/clients/IpWhitelistCard'

export const Route = createFileRoute('/dashboard/clients/$clientId/')({
  component: ClientDetailsPage,
})

function ClientDetailsPage() {
  const { clientId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [paymentPage, setPaymentPage] = useState(1)

  // Fetch client data
  const { data: client, isLoading, error } = useClient(clientId)
  const deleteClient = useDeleteClient()

  // Fetch related data (conditionally based on active tab)
  const { data: usersData, isLoading: usersLoading } = useUsers({ clientId })
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentHistory({
    clientId,
    page: paymentPage,
    limit: 10,
  })
  const { data: pricingData, isLoading: pricingLoading } =
    useClientPricing(clientId)
  const { data: servicesData, isLoading: servicesLoading } =
    useClientServices(clientId)
  const { data: balanceData, isLoading: balanceLoading } =
    useClientBalanceSummary(clientId)

  const handleDelete = () => {
    if (
      window.confirm(
        t(
          'clients.deleteConfirmDescription',
          'Are you sure you want to delete this client? This action cannot be undone.',
        ),
      )
    ) {
      deleteClient.mutate(clientId, {
        onSuccess: () => {
          navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } })
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          {t('common.error', 'Error')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('clients.notFound', 'Client not found')}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            navigate({
              to: '/dashboard/clients',
              search: { page: 1, limit: 10 },
            })
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back', 'Back to Clients')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: '/dashboard/clients',
                search: { page: 1, limit: 10 },
              })
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {client.name}
            </h1>
            <div className="flex flex-wrap items-center mt-1 gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  client.status === ClientStatus.ACTIVE
                    ? 'bg-green-100 text-green-800'
                    : client.status === ClientStatus.INACTIVE
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {client.status}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                ID: {client.id}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() =>
              navigate({ to: `/dashboard/clients/${client.id}/edit` })
            }
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('common.edit', 'Edit')}</span>
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {t('common.delete', 'Delete')}
            </span>
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm">
            {t('clients.tabs.overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 text-xs sm:text-sm">
            {t('clients.tabs.users', 'Users')}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex-1 text-xs sm:text-sm">
            {t('clients.tabs.pricing', 'Pricing')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 text-xs sm:text-sm">
            <span className="hidden sm:inline">
              {t('clients.tabs.payments', 'Payment History')}
            </span>
            <span className="sm:hidden">
              {t('clients.tabs.paymentsShort', 'Payments')}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('clients.contactInfo', 'Contact Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {client.phone || t('common.notProvided', 'Not provided')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {client.address || t('common.notProvided', 'Not provided')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <SubscriptionCard
              subscriptionPlan={client.subscriptionPlan}
              subscriptionExpiry={client.subscriptionExpiry}
            />

            <ClientServicesCard
              clientId={clientId}
              services={servicesData || []}
              balances={balanceData?.balances || []}
              isLoading={servicesLoading || balanceLoading}
            />

            <SipExtensionRangeCard
              clientId={clientId}
              services={servicesData || []}
              isLoading={servicesLoading}
            />

            <SmsMaskingCard
              clientId={clientId}
              services={servicesData || []}
              isLoading={servicesLoading}
            />

            <IpWhitelistCard
              clientId={clientId}
              services={servicesData || []}
              isLoading={servicesLoading}
            />

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('clients.systemInfo', 'System Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      {t('common.createdAt', 'Created At')}
                    </span>

                    <span>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      {t('common.updatedAt', 'Updated At')}
                    </span>
                    <span>
                      {new Date(client.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <ClientUsersTable
            users={usersData?.data || []}
            isLoading={usersLoading}
            clientId={clientId}
          />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <ClientPricingTable
            pricing={pricingData || []}
            isLoading={pricingLoading}
            clientId={clientId}
          />
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments">
          <PaymentHistoryTable
            payments={paymentsData?.data || []}
            currentPage={paymentPage}
            totalPages={paymentsData?.meta?.totalPages || 1}
            onPageChange={setPaymentPage}
            isLoading={paymentsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
