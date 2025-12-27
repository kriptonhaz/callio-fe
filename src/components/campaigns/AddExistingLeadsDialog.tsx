import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnassignedLeads } from '@/hooks/api/useLeads'
import { useBulkAssignLeads } from '@/hooks/api/useLeadAssignments'
import type { Lead } from '@/lib/api/types/leads.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

interface AddExistingLeadsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  clientId: string
  onSuccess?: () => void
}

export function AddExistingLeadsDialog({
  open,
  onOpenChange,
  campaignId,
  clientId,
  onSuccess,
}: AddExistingLeadsDialogProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const debouncedSearch = useDebounce(searchValue, 500)

  const limit = 10

  // Fetch unassigned leads for this campaign
  const { data: leadsData, isLoading } = useUnassignedLeads(campaignId, {
    clientId,
    page,
    limit,
    search: debouncedSearch,
  })

  const { mutate: bulkAssign, isPending: isAssigning } = useBulkAssignLeads()

  const leads = leadsData?.data || []
  const totalPages = leadsData?.meta.totalPages || 1

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchValue('')
      setPage(1)
      setSelectedLeadIds(new Set())
    }
  }, [open])

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedLeadIds)
      leads.forEach((lead) => newSelected.add(lead.id))
      setSelectedLeadIds(newSelected)
    } else {
      const newSelected = new Set(selectedLeadIds)
      leads.forEach((lead) => newSelected.delete(lead.id))
      setSelectedLeadIds(newSelected)
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeadIds)
    if (checked) {
      newSelected.add(leadId)
    } else {
      newSelected.delete(leadId)
    }
    setSelectedLeadIds(newSelected)
  }

  const handleAddToCompaign = () => {
    if (selectedLeadIds.size === 0) {
      toast.error(
        t('leads.selectAtLeastOne', 'Please select at least one lead'),
      )
      return
    }

    bulkAssign(
      {
        campaignId,
        leadIds: Array.from(selectedLeadIds),
      },
      {
        onSuccess: () => {
          toast.success(
            t(
              'leads.addedToCampaign',
              `Successfully added ${selectedLeadIds.size} lead(s) to campaign`,
            ),
          )
          onOpenChange(false)
          onSuccess?.()
        },
        onError: () => {
          toast.error(
            t('leads.addToCampaignFailed', 'Failed to add leads to campaign'),
          )
        },
      },
    )
  }

  const allCurrentPageSelected =
    leads.length > 0 && leads.every((lead) => selectedLeadIds.has(lead.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('leads.addExisting', 'Add Existing Leads')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'leads.addExistingDescription',
              'Select leads from your database to add to this campaign.',
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(
              'leads.searchPlaceholder',
              'Search by name, phone, or email...',
            )}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('common.selectAll', 'Select all')}
                  />
                </TableHead>
                <TableHead>{t('leads.name', 'Name')}</TableHead>
                <TableHead>{t('leads.phone', 'Phone')}</TableHead>
                <TableHead>{t('leads.email', 'Email')}</TableHead>
                <TableHead>{t('leads.city', 'City')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading', 'Loading...')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {t('leads.noLeadsFound', 'No leads found')}
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead: Lead) => (
                  <TableRow
                    key={lead.id}
                    className={
                      selectedLeadIds.has(lead.id) ? 'bg-muted/50' : ''
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={(checked) =>
                          handleSelectLead(lead.id, checked as boolean)
                        }
                        aria-label={`Select ${lead.leadName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.leadName}
                    </TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.city || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.previous', 'Previous')}
            </Button>
            <span className="text-sm">
              {t('common.pageOf', 'Page {{current}} of {{total}}', {
                current: page,
                total: totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              {t('common.next', 'Next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedLeadIds.size > 0
              ? t('leads.selectedCount', '{{count}} lead(s) selected', {
                  count: selectedLeadIds.size,
                })
              : t('leads.noSelection', 'No leads selected')}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleAddToCompaign}
              disabled={selectedLeadIds.size === 0 || isAssigning}
            >
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('leads.addToCampaign', 'Add to Campaign')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
