import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Paperclip, Send, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { HTTPError } from 'ky'
import { EmailChipInput } from './EmailChipInput'
import { HtmlEmailFrame } from './HtmlEmailFrame'
import type { EmailAccount } from '@/lib/api/types/email.types'
import type { Lead } from '@/lib/api/types/leads.types'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSendEmail } from '@/hooks/api/useEmail'
import { useEmailTemplates } from '@/hooks/api/useEmailTemplates'
import { renderPreview } from '@/lib/email/preview'
import { SAMPLE_PREVIEW_LEAD } from '@/lib/email/template-variables'

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
  /**
   * The lead this email is being sent to. When provided, a "Use template"
   * dropdown appears at the top of the dialog and template variables
   * ({leadName}, {firstName}, etc.) are substituted with this lead's data
   * on the fly.
   */
  lead?: Lead | null
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
  lead,
}: Props) {
  const [to, setTo] = useState<Array<string>>(initial?.to ?? [])
  const [cc, setCc] = useState<Array<string>>(initial?.cc ?? [])
  const [bcc, setBcc] = useState<Array<string>>(initial?.bcc ?? [])
  const [showCcBcc, setShowCcBcc] = useState(
    (initial?.cc?.length ?? 0) > 0 || (initial?.bcc?.length ?? 0) > 0,
  )
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  // Tracks whether the body is HTML (set after picking a template) vs plain
  // text (the default). Sent over the wire as `html` or `text` accordingly.
  const [isHtml, setIsHtml] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [attachments, setAttachments] = useState<Array<File>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Templates are only fetched when the dialog has lead context — i.e. the
  // caller can do variable substitution. In the standalone email page flow
  // (no lead), we keep the dialog template-free.
  const templatesEnabled = !!lead
  const { data: templatesPage } = useEmailTemplates(
    templatesEnabled ? { page: 1, limit: 100 } : {},
  )
  const templates = templatesEnabled ? templatesPage?.data ?? [] : []

  const previewLead = useMemo(() => {
    if (!lead) return SAMPLE_PREVIEW_LEAD
    return {
      leadName: lead.leadName,
      phone: lead.phone,
      email: lead.email ?? '',
      city: lead.city ?? '',
      province: lead.province ?? '',
      companyName: lead.companyName ?? '',
      jobTitle: lead.jobTitle ?? '',
      occupation: lead.occupation ?? '',
      address: lead.address ?? '',
      customFields: lead.customFields ?? null,
    }
  }, [lead])

  const handlePickTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    setSubject(renderPreview(tpl.subject, previewLead))
    setBody(renderPreview(tpl.html, previewLead))
    setIsHtml(true)
  }

  // Clear the picked template and reset subject/body back to the dialog's
  // initial seed values so the user can start over (e.g., they picked the
  // wrong template and want to write a plain-text message instead).
  const handleClearTemplate = () => {
    setSelectedTemplateId('')
    setSubject(initial?.subject ?? '')
    setBody(initial?.body ?? '')
    setIsHtml(false)
  }

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
      setIsHtml(false)
      setSelectedTemplateId('')
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
        ...(isHtml ? { html: body } : { text: body }),
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

          {/* Template picker (only when we have lead context for substitution) */}
          {templatesEnabled && (
            <div className="grid grid-cols-[70px_1fr] items-center gap-2">
              <Label
                className="text-sm text-muted-foreground inline-flex items-center gap-1"
                htmlFor="compose-template"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Template
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedTemplateId}
                    onValueChange={handlePickTemplate}
                  >
                    <SelectTrigger id="compose-template">
                      <SelectValue
                        placeholder={
                          templates.length === 0
                            ? 'No saved templates'
                            : 'Pick a template…'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="font-medium">{t.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {t.subject}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplateId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearTemplate}
                    className="h-9 gap-1 text-xs text-muted-foreground"
                    title="Clear template selection"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
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

          {/* Body — plain textarea by default, swaps to Edit/Preview tabs once
              an HTML template has been selected. */}
          {isHtml ? (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-0">
                <HtmlEmailFrame
                  html={body}
                  className="w-full min-h-[240px] max-h-[60vh] bg-white rounded border"
                />
              </TabsContent>
              <TabsContent value="edit" className="mt-0">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message…"
                  className="min-h-[240px] resize-y font-mono text-xs"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              className="min-h-[240px] resize-y"
            />
          )}

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
