import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  Mail,
  Paperclip,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEmailHistoryByAddress } from '@/hooks/api/useEmail'
import { formatSmartDate } from '@/lib/format/smart-date'
import type { EmailHistoryEnvelope } from '@/lib/api/types/email.types'
import type { Lead } from '@/lib/api/types/leads.types'
import { EmailMessageDialog } from './EmailMessageDialog'

interface Props {
  lead: Lead | null | undefined
}

export function EmailHistoryCard({ lead }: Props) {
  const [open, setOpen] = useState(false)

  // Collapse on lead change so the next lead starts clean.
  useEffect(() => {
    setOpen(false)
  }, [lead?.id])

  if (!lead?.email) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors flex-row items-center justify-between gap-3 space-y-0 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Email History</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <HistoryContent email={lead.email} />
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function HistoryContent({ email }: { email: string }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useEmailHistoryByAddress(email, 50)
  const [selected, setSelected] = useState<EmailHistoryEnvelope | null>(null)

  const labels = {
    today: t('leads.today', 'Today'),
    yesterday: t('leads.yesterday', 'Yesterday'),
  }

  const failedAccounts = (data?.accounts ?? []).filter((a) => !a.ok)

  return (
    <div className="border-t">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6 px-3">
          {error.message}
        </p>
      ) : (data?.messages.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 px-3">
          No email exchanged with this lead yet.
        </p>
      ) : (
        <>
          {failedAccounts.length > 0 && (
            <div className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-2 py-1.5 text-xs flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {failedAccounts.length} account
                {failedAccounts.length === 1 ? '' : 's'} failed to search —
                results may be incomplete.
              </span>
            </div>
          )}
          <div className="max-h-[320px] overflow-y-auto divide-y">
            {data?.messages.map((m) => (
              <HistoryRow
                key={`${m.accountId}-${m.folder}-${m.uid}`}
                message={m}
                labels={labels}
                onClick={() => setSelected(m)}
              />
            ))}
          </div>
          <div className="px-3 py-2 border-t flex justify-center">
            <Badge variant="secondary" className="text-[10px] h-5">
              {data?.messages.length} message
              {data?.messages.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </>
      )}

      <EmailMessageDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        accountId={selected?.accountId ?? null}
        accountEmail={selected?.accountEmail}
        folder={selected?.folder ?? null}
        uid={selected?.uid ?? null}
      />
    </div>
  )
}

function HistoryRow({
  message,
  labels,
  onClick,
}: {
  message: EmailHistoryEnvelope
  labels: { today: string; yesterday: string }
  onClick: () => void
}) {
  const isOutbound = message.direction === 'outbound'
  // In the "party" we want the non-user counterparty — inbound uses from[0],
  // outbound uses to[0] (closest match to the lead).
  const party = isOutbound
    ? message.to[0] ?? null
    : message.from[0] ?? null
  const partyLabel = party
    ? party.name || party.address
    : '(unknown)'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col gap-0.5 text-left px-3 py-2 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'text-[10px] font-medium shrink-0',
              isOutbound ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {isOutbound ? '↗' : '↙'}
          </span>
          <span
            className={cn(
              'truncate text-xs',
              !message.seen ? 'font-semibold' : 'font-medium',
            )}
            title={party?.address}
          >
            {partyLabel}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {formatSmartDate(message.date, labels)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {message.hasAttachments && (
          <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span
          className={cn(
            'text-xs truncate min-w-0 flex-1',
            !message.seen ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {message.subject || '(no subject)'}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground truncate">
        via {message.accountEmail}
        {message.folder && ` · ${message.folder}`}
      </span>
    </button>
  )
}
