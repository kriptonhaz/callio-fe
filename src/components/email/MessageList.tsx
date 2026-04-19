import { useMemo, useState } from 'react'
import { Loader2, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  EmailAddress,
  EmailEnvelope,
} from '@/lib/api/types/email.types'
import { cn } from '@/lib/utils'
import { formatSmartDate } from '@/lib/format/smart-date'
import { StandardPagination } from '@/components/common/StandardPagination'
import {
  useEmailFolders,
  useEmailMessages,
} from '@/hooks/api/useEmail'
import { useAllClientLeads } from '@/hooks/api/useAllClientLeads'
import { useMe } from '@/hooks/api/useAuth'

interface Props {
  accountId: string | null
  folder: string | null
  selectedUid: number | null
  onSelect: (uid: number) => void
}

const PAGE_SIZE = 50

export function MessageList({
  accountId,
  folder,
  selectedUid,
  onSelect,
}: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useEmailMessages(
    accountId,
    folder,
    page,
    PAGE_SIZE,
  )
  const { data: folders } = useEmailFolders(accountId)

  const { data: me } = useMe()
  const { data: allLeads } = useAllClientLeads(me?.clientId)
  const leadNameByEmail = useMemo(() => {
    const map = new Map<string, string>()
    for (const lead of allLeads ?? []) {
      const addr = lead.email?.trim().toLowerCase()
      if (addr) map.set(addr, lead.leadName)
    }
    return map
  }, [allLeads])

  const rows = data?.data ?? []
  const meta = data?.meta

  // "Sent-like" folders show the recipient rather than the sender (every mail
  // client does this — the sender in a Sent folder is always the user).
  const isSentLike = useMemo(
    () => isSentLikeFolder(folders, folder),
    [folders, folder],
  )

  const labels = {
    today: t('leads.today', 'Today'),
    yesterday: t('leads.yesterday', 'Yesterday'),
  }

  if (!accountId || !folder) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Select a folder to view messages.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">{folder}</span>
          {meta && (
            <span className="text-xs text-muted-foreground">
              {meta.total.toLocaleString()} messages
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            This folder is empty.
          </div>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <MessageRow
                key={row.uid}
                row={row}
                selected={selectedUid === row.uid}
                onClick={() => onSelect(row.uid)}
                labels={labels}
                isSentLike={isSentLike}
                leadNameByEmail={leadNameByEmail}
              />
            ))}
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="border-t p-2">
          <StandardPagination
            currentPage={page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

function MessageRow({
  row,
  selected,
  onClick,
  labels,
  isSentLike,
  leadNameByEmail,
}: {
  row: EmailEnvelope
  selected: boolean
  onClick: () => void
  labels: { today: string; yesterday: string }
  isSentLike: boolean
  leadNameByEmail: Map<string, string>
}) {
  const party = isSentLike ? row.to : row.from
  const first = party.length > 0 ? party[0] : null
  const baseLabel = first
    ? resolveContactName(first, leadNameByEmail)
    : '(unknown)'
  const suffix = party.length > 1 ? `, +${party.length - 1}` : ''
  const displayLabel = `${baseLabel}${suffix}`
  const prefix = isSentLike ? 'To: ' : ''
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex flex-col gap-0.5 text-left px-4 py-3 hover:bg-muted/50 transition-colors',
        selected && 'bg-muted',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'truncate text-sm',
            !row.seen ? 'font-semibold' : 'font-medium',
          )}
          title={first?.address ?? undefined}
        >
          {isSentLike && (
            <span className="text-muted-foreground font-normal">{prefix}</span>
          )}
          {displayLabel}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {formatSmartDate(row.date, labels)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {row.hasAttachments && (
          <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span
          className={cn(
            'text-xs truncate min-w-0 flex-1',
            !row.seen ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {row.subject || '(no subject)'}
        </span>
        {!row.seen && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}
      </div>
    </button>
  )
}

const SENT_LIKE_SPECIAL_USE = new Set(['\\Sent', '\\Drafts'])
const SENT_LIKE_PATHS = new Set([
  'sent',
  'sent mail',
  'sent items',
  '[gmail]/sent mail',
  '[gmail]/drafts',
  'drafts',
])

function isSentLikeFolder(
  folders: Array<{ path: string; specialUse: string | null }> | undefined,
  folderPath: string | null,
): boolean {
  if (!folderPath) return false
  const match = folders?.find((f) => f.path === folderPath)
  if (match?.specialUse && SENT_LIKE_SPECIAL_USE.has(match.specialUse))
    return true
  return SENT_LIKE_PATHS.has(folderPath.toLowerCase())
}

// Compose the display string for a contact, cross-referencing the email
// address against the client's leads:
// - Sender has a display name AND matches a lead  → "Display Name - Lead Name"
// - Only email matches a lead (no display name)   → "Lead Name"
// - No lead match                                 → whatever the header says
function resolveContactName(
  addr: EmailAddress,
  leadNameByEmail: Map<string, string>,
): string {
  const leadName = addr.address
    ? leadNameByEmail.get(addr.address.toLowerCase())
    : undefined
  const headerName = addr.name?.trim() ?? ''

  if (headerName && leadName && headerName !== leadName) {
    return `${headerName} - ${leadName}`
  }
  if (leadName) return leadName
  if (headerName) return headerName
  return addr.address || '(unknown)'
}
