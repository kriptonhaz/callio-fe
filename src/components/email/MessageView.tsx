import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { HTTPError } from 'ky'
import {
  Code,
  CornerDownLeft,
  FileText,
  Forward,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { HtmlEmailFrame } from './HtmlEmailFrame'
import { AttachmentChip } from './AttachmentChip'
import type {
  EmailAddress,
  EmailMessage,
} from '@/lib/api/types/email.types'
import type { ComposeInitialValues } from './ComposeDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useEmailAccounts,
  useEmailMessage,
  useStartGoogleOAuth,
} from '@/hooks/api/useEmail'
import { useAllClientLeads } from '@/hooks/api/useAllClientLeads'
import { useMe } from '@/hooks/api/useAuth'

interface Props {
  accountId: string | null
  folder: string | null
  uid: number | null
  onReply?: (init: ComposeInitialValues) => void
}

export function MessageView({ accountId, folder, uid, onReply }: Props) {
  const { data, isLoading, error } = useEmailMessage(accountId, folder, uid)
  const { data: accounts } = useEmailAccounts()
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
  const googleMut = useStartGoogleOAuth()
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html')

  const effectiveMode = useMemo(() => {
    if (!data) return viewMode
    if (viewMode === 'html' && !data.bodyHtml && data.bodyText) return 'text'
    if (viewMode === 'text' && !data.bodyText && data.bodyHtml) return 'html'
    return viewMode
  }, [data, viewMode])

  if (!accountId || !folder || uid == null) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Select a message to read.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const is401 =
    error instanceof HTTPError && error.response.status === 401

  if (is401) {
    const account = accounts?.find((a) => a.id === accountId)
    const handleReconnect = async () => {
      if (account?.provider === 'google') {
        try {
          const { authUrl } = await googleMut.mutateAsync(
            `${window.location.origin}/dashboard/email`,
          )
          window.location.href = authUrl
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : 'Failed to start reconnect',
          )
        }
      } else {
        toast.info(
          'Delete this account and add it again to update the password.',
        )
      }
    }
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-sm text-center flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Connection expired</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your email credentials were revoked or have expired. Reconnect
              to continue reading messages.
            </p>
          </div>
          <Button onClick={handleReconnect} disabled={googleMut.isPending}>
            {googleMut.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reconnect {account?.provider === 'google' ? 'Google' : 'account'}
          </Button>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-destructive px-6 text-center">
        {error?.message ?? 'Failed to load message.'}
      </div>
    )
  }

  const hasHtml = !!data.bodyHtml
  const hasText = !!data.bodyText

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex flex-col gap-2">
        <h2 className="text-lg font-semibold break-words">
          {data.subject || '(no subject)'}
        </h2>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <AddressRow
            label="From"
            list={data.from}
            leadNameByEmail={leadNameByEmail}
          />
          <AddressRow
            label="To"
            list={data.to}
            leadNameByEmail={leadNameByEmail}
          />
          {data.cc.length > 0 && (
            <AddressRow
              label="Cc"
              list={data.cc}
              leadNameByEmail={leadNameByEmail}
            />
          )}
          <div>
            <span className="font-medium">Date:</span>{' '}
            {format(new Date(data.date), 'dd MMM yyyy HH:mm')}
          </div>
          {data.flags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {data.flags.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="text-[10px] h-4 font-mono"
                >
                  {f}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-1">
            {hasHtml && hasText && (
              <>
                <Button
                  size="sm"
                  variant={effectiveMode === 'html' ? 'default' : 'outline'}
                  onClick={() => setViewMode('html')}
                  className="h-7 gap-1.5 text-xs"
                >
                  <FileText className="h-3 w-3" />
                  Formatted
                </Button>
                <Button
                  size="sm"
                  variant={effectiveMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setViewMode('text')}
                  className="h-7 gap-1.5 text-xs"
                >
                  <Code className="h-3 w-3" />
                  Plain text
                </Button>
              </>
            )}
          </div>
          {onReply && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReply(buildReplyInitial(data))}
                className="h-7 gap-1.5 text-xs"
              >
                <CornerDownLeft className="h-3 w-3" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReply(buildForwardInitial(data))}
                className="h-7 gap-1.5 text-xs"
              >
                <Forward className="h-3 w-3" />
                Forward
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {effectiveMode === 'html' && data.bodyHtml ? (
          <HtmlEmailFrame html={data.bodyHtml} />
        ) : data.bodyText ? (
          <pre className="whitespace-pre-wrap break-words text-sm font-sans bg-muted/40 rounded p-4">
            {data.bodyText}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">(No body content)</p>
        )}

        {data.attachments.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Attachments ({data.attachments.length})
            </span>
            <div className="flex flex-col gap-2">
              {data.attachments.map((att) => (
                <AttachmentChip
                  key={att.partId}
                  accountId={accountId}
                  uid={data.uid}
                  folder={folder}
                  attachment={att}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AddressRow({
  label,
  list,
  leadNameByEmail,
}: {
  label: string
  list: Array<EmailAddress>
  leadNameByEmail: Map<string, string>
}) {
  if (list.length === 0) return null
  return (
    <div className="truncate">
      <span className="font-medium">{label}:</span>{' '}
      {list
        .map((a) => {
          const leadName = a.address
            ? leadNameByEmail.get(a.address.toLowerCase())
            : undefined
          const header = a.name?.trim() ?? ''
          if (header && leadName && header !== leadName) {
            return `${header} - ${leadName} <${a.address}>`
          }
          if (leadName) return `${leadName} <${a.address}>`
          if (header) return `${header} <${a.address}>`
          return a.address
        })
        .join(', ')}
    </div>
  )
}

function withRePrefix(subject: string): string {
  return /^re:/i.test(subject) ? subject : `Re: ${subject || ''}`
}

function withFwdPrefix(subject: string): string {
  return /^fwd?:/i.test(subject) ? subject : `Fwd: ${subject || ''}`
}

function buildQuoted(msg: EmailMessage): string {
  const when = msg.date
    ? new Date(msg.date).toLocaleString()
    : 'an earlier date'
  const senderLine = msg.from
    .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
    .join(', ')
  const bodyLines = (msg.bodyText ?? '').split(/\r?\n/)
  const quoted = bodyLines.map((l) => `> ${l}`).join('\n')
  return `\n\nOn ${when}, ${senderLine} wrote:\n${quoted}`
}

function buildReplyInitial(msg: EmailMessage): ComposeInitialValues {
  const to = msg.from.filter((a) => !!a.address).map((a) => a.address)
  return {
    to,
    subject: withRePrefix(msg.subject),
    body: buildQuoted(msg),
  }
}

function buildForwardInitial(msg: EmailMessage): ComposeInitialValues {
  return {
    subject: withFwdPrefix(msg.subject),
    body: buildQuoted(msg),
  }
}
