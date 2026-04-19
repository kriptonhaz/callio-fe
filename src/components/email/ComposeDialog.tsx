import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Paperclip, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { HTTPError } from 'ky'
import { EmailChipInput } from './EmailChipInput'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useSendEmail } from '@/hooks/api/useEmail'
import type { EmailAccount } from '@/lib/api/types/email.types'

export interface ComposeInitialValues {
  to?: Array<string>
  cc?: Array<string>
  bcc?: Array<string>
  subject?: string
  body?: string
  inReplyTo?: string
  references?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string | null
  accountEmail?: string
  initial?: ComposeInitialValues
  /**
   * When provided, render an account-picker dropdown at the top of the dialog
   * and let the parent control which account is used. Leave undefined when
   * the caller already knows which account (e.g. inside the email page
   * itself where the URL drives the selection).
   */
  accounts?: Array<EmailAccount>
  onAccountIdChange?: (id: string) => void
}

// Recommended limits — Gmail caps around 25 MB for total payload (attachments
// + MIME framing). We show a bar up to 22 MB to leave headroom.
const MAX_TOTAL_BYTES = 22 * 1024 * 1024
const MAX_PER_FILE_BYTES = 20 * 1024 * 1024

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ComposeDialog({
  open,
  onOpenChange,
  accountId,
  accountEmail,
  initial,
  accounts,
  onAccountIdChange,
}: Props) {
  const [to, setTo] = useState<Array<string>>(initial?.to ?? [])
  const [cc, setCc] = useState<Array<string>>(initial?.cc ?? [])
  const [bcc, setBcc] = useState<Array<string>>(initial?.bcc ?? [])
  const [showCcBcc, setShowCcBcc] = useState(
    (initial?.cc?.length ?? 0) > 0 || (initial?.bcc?.length ?? 0) > 0,
  )
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [attachments, setAttachments] = useState<Array<File>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const sendMut = useSendEmail(accountId)

  // Reset state when dialog closes.
  useEffect(() => {
    if (!open) {
      setTo(initial?.to ?? [])
      setCc(initial?.cc ?? [])
      setBcc(initial?.bcc ?? [])
      setShowCcBcc(
        (initial?.cc?.length ?? 0) > 0 || (initial?.bcc?.length ?? 0) > 0,
      )
      setSubject(initial?.subject ?? '')
      setBody(initial?.body ?? '')
      setAttachments([])
    }
     
  }, [open])

  // Re-seed when `initial` changes and dialog is open (e.g., opening Reply
  // for a different message).
  useEffect(() => {
    if (open) {
      if (initial?.to) setTo(initial.to)
      if (initial?.cc) setCc(initial.cc)
      if (initial?.bcc) setBcc(initial.bcc)
      if (initial?.subject !== undefined) setSubject(initial.subject)
      if (initial?.body !== undefined) setBody(initial.body)
      if ((initial?.cc?.length ?? 0) > 0 || (initial?.bcc?.length ?? 0) > 0) {
        setShowCcBcc(true)
      }
    }
     
  }, [initial])

  const totalSize = useMemo(
    () => attachments.reduce((sum, f) => sum + f.size, 0),
    [attachments],
  )
  const overBudget = totalSize > MAX_TOTAL_BYTES
  const pct = Math.min(100, (totalSize / MAX_TOTAL_BYTES) * 100)

  const handleFilePick = (files: FileList | null) => {
    if (!files) return
    const next: Array<File> = []
    let runningTotal = totalSize
    for (const f of Array.from(files)) {
      if (f.size > MAX_PER_FILE_BYTES) {
        toast.error(`"${f.name}" exceeds 20 MB per-file limit`)
        continue
      }
      runningTotal += f.size
      next.push(f)
    }
    if (next.length === 0) return
    if (runningTotal > MAX_TOTAL_BYTES) {
      toast.warning(
        'Total attachments exceed 22 MB — message may be rejected by some providers.',
      )
    }
    setAttachments((prev) => [...prev, ...next])
  }

  const canSend =
    accountId &&
    to.length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    !overBudget &&
    !sendMut.isPending

  const handleSend = async () => {
    if (!accountId) {
      toast.error('No email account selected')
      return
    }
    try {
      const resp = await sendMut.mutateAsync({
        to,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject: subject.trim(),
        text: body,
        inReplyTo: initial?.inReplyTo,
        references: initial?.references,
        attachments: attachments.length ? attachments : undefined,
      })
      toast.success(
        resp.rejected.length > 0
          ? `Sent with ${resp.rejected.length} rejected recipient(s)`
          : 'Message sent',
      )
      onOpenChange(false)
    } catch (e) {
      toast.error(await extractErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          {accountEmail && !accounts && (
            <DialogDescription>
              From <span className="font-medium">{accountEmail}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {accounts && accounts.length > 0 && onAccountIdChange && (
            <div className="grid grid-cols-[70px_1fr] items-center gap-2">
              <Label
                className="text-sm text-muted-foreground"
                htmlFor="compose-account"
              >
                From
              </Label>
              <Select
                value={accountId ?? ''}
                onValueChange={onAccountIdChange}
              >
                <SelectTrigger id="compose-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-medium">{a.displayName}</span>
                      <span className="text-muted-foreground ml-2">
                        {a.email}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* To */}
          <div className="grid grid-cols-[70px_1fr] items-start gap-2">
            <Label className="pt-2 text-sm text-muted-foreground" htmlFor="to">
              To
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <EmailChipInput
                  id="to"
                  value={to}
                  onChange={setTo}
                  placeholder="recipient@example.com"
                />
              </div>
              {!showCcBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setShowCcBcc(true)}
                >
                  Cc / Bcc
                </Button>
              )}
            </div>
          </div>

          {showCcBcc && (
            <>
              <div className="grid grid-cols-[70px_1fr] items-start gap-2">
                <Label
                  className="pt-2 text-sm text-muted-foreground"
                  htmlFor="cc"
                >
                  Cc
                </Label>
                <EmailChipInput id="cc" value={cc} onChange={setCc} />
              </div>
              <div className="grid grid-cols-[70px_1fr] items-start gap-2">
                <Label
                  className="pt-2 text-sm text-muted-foreground"
                  htmlFor="bcc"
                >
                  Bcc
                </Label>
                <EmailChipInput id="bcc" value={bcc} onChange={setBcc} />
              </div>
            </>
          )}

          {/* Subject */}
          <div className="grid grid-cols-[70px_1fr] items-center gap-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor="subject"
            >
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>

          {/* Body */}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="min-h-[240px] resize-y"
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  Attachments ({attachments.length})
                </span>
                <span
                  className={cn(
                    'text-muted-foreground',
                    overBudget && 'text-destructive font-medium',
                  )}
                >
                  {formatSize(totalSize)} / {formatSize(MAX_TOTAL_BYTES)}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full transition-all',
                    overBudget ? 'bg-destructive' : 'bg-primary',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-col gap-1">
                {attachments.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-muted-foreground">
                      {formatSize(f.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {overBudget && (
                <p className="text-xs text-destructive">
                  Total attachments exceed the 22 MB safe limit. Remove some
                  files or most providers will reject the message.
                </p>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleFilePick(e.target.files)
            e.target.value = ''
          }}
        />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Paperclip className="h-4 w-4" />
            Attach
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={sendMut.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="gap-2"
            >
              {sendMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

async function extractErrorMessage(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    const status = err.response.status
    if (status === 413) {
      return 'Attachment too big (20 MB per file, ~22 MB total safe limit).'
    }
    try {
      const json = (await err.response.clone().json()) as { message?: unknown }
      if (typeof json.message === 'string') return json.message
      if (Array.isArray(json.message)) return json.message.join(', ')
    } catch {
      // ignore
    }
    if (status === 401) return 'Email connection expired — reconnect the account.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Failed to send message'
}
