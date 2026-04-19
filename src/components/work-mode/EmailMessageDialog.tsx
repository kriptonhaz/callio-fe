import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { HtmlEmailFrame } from '@/components/email/HtmlEmailFrame'
import { AttachmentChip } from '@/components/email/AttachmentChip'
import { useEmailMessage } from '@/hooks/api/useEmail'
import type { EmailAddress } from '@/lib/api/types/email.types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string | null
  accountEmail?: string
  folder: string | null
  uid: number | null
}

export function EmailMessageDialog({
  open,
  onOpenChange,
  accountId,
  accountEmail,
  folder,
  uid,
}: Props) {
  const { data, isLoading, error } = useEmailMessage(accountId, folder, uid)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">
            {data?.subject || '(no subject)'}
          </DialogTitle>
          {accountEmail && (
            <DialogDescription>
              Account <span className="font-medium">{accountEmail}</span>
              {folder && (
                <>
                  {' '}
                  · folder <span className="font-medium">{folder}</span>
                </>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !data ? (
          <p className="text-sm text-destructive text-center py-8">
            {error?.message ?? 'Failed to load message.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <AddressRow label="From" list={data.from} />
              <AddressRow label="To" list={data.to} />
              {data.cc.length > 0 && <AddressRow label="Cc" list={data.cc} />}
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

            {data.bodyHtml ? (
              <HtmlEmailFrame html={data.bodyHtml} />
            ) : data.bodyText ? (
              <pre className="whitespace-pre-wrap break-words text-sm font-sans bg-muted/40 rounded p-3">
                {data.bodyText}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                (No body content)
              </p>
            )}

            {data.attachments.length > 0 && accountId && folder && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Attachments ({data.attachments.length})
                </span>
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
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddressRow({
  label,
  list,
}: {
  label: string
  list: Array<EmailAddress>
}) {
  if (list.length === 0) return null
  return (
    <div className="truncate">
      <span className="font-medium">{label}:</span>{' '}
      {list
        .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
        .join(', ')}
    </div>
  )
}
