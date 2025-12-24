import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Edit } from 'lucide-react'
import type {
  EffectivePricing,
  PricingSource,
} from '@/lib/api/types/pricing.types'
import { EditPricingModal } from './EditPricingModal'

interface ClientPricingTableProps {
  pricing: EffectivePricing[]
  isLoading?: boolean
  clientId: string
}

export function ClientPricingTable({
  pricing,
  isLoading = false,
  clientId,
}: ClientPricingTableProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [editingPricing, setEditingPricing] = useState<EffectivePricing | null>(
    null,
  )
  const [editModalOpen, setEditModalOpen] = useState(false)

  const filteredPricing = pricing.filter((item) => {
    const matchesSearch =
      item.serviceType.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.salesPerson?.name.toLowerCase().includes(searchValue.toLowerCase())
    return matchesSearch
  })

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getServiceTypeBadge = (serviceType: string) => {
    const serviceClasses = {
      voice: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      sms: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      data: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          serviceClasses[serviceType as keyof typeof serviceClasses] ||
          'bg-gray-100 text-gray-800'
        }`}
      >
        {serviceType.toUpperCase()}
      </span>
    )
  }

  const getPricingSourceBadge = (pricingSource: PricingSource) => {
    const isCustom = pricingSource === 'custom'
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isCustom
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        }`}
      >
        {isCustom
          ? t('clients.pricing.custom', 'Custom')
          : t('clients.pricing.default', 'Default')}
      </span>
    )
  }

  const handleEdit = (item: EffectivePricing) => {
    setEditingPricing(item)
    setEditModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('clients.pricing.title', 'Pricing')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
              <Input
                placeholder={t(
                  'clients.pricing.searchPlaceholder',
                  'Search pricing...',
                )}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.serviceType', 'Service Type')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.pricePerUnit', 'Price/Unit')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.unitType', 'Unit Type')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.source', 'Source')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.salesPerson', 'Sales Person')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('clients.pricing.effectiveFrom', 'Effective From')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary text-right">
                    {t('common.actions', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('common.loading', 'Loading...')}
                    </TableCell>
                  </TableRow>
                ) : filteredPricing.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('clients.pricing.noPricing', 'No pricing found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPricing.map((item) => (
                    <TableRow key={item.pricingId}>
                      <TableCell className="font-medium">
                        {getServiceTypeBadge(item.serviceType)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.pricePerUnit, item.currency)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {item.unitType}
                      </TableCell>
                      <TableCell>
                        {getPricingSourceBadge(item.pricingSource)}
                      </TableCell>
                      <TableCell>{item.salesPerson?.name ?? '-'}</TableCell>
                      <TableCell>{formatDate(item.effectiveFrom)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t('common.actions', 'Actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit', 'Edit')}
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
        </CardContent>
      </Card>

      <EditPricingModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        pricing={editingPricing}
        clientId={clientId}
      />
    </>
  )
}
