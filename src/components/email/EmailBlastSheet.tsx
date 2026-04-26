import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { AlertTriangle, Loader2, Mail, Search, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import type { EmailTemplate } from '@/lib/api/types/email.types'
import type { Lead } from '@/lib/api/types/leads.types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { StandardPagination } from '@/components/common/StandardPagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useLeads } from '@/hooks/api/useLeads'
import { useEmailAccounts } from '@/hooks/api/useEmail'
import {
  useEmailTemplates,
  useSendEmailBlast,
} from '@/hooks/api/useEmailTemplates'
import { HtmlEmailFrame } from './HtmlEmailFrame'
import { renderPreview } from '@/lib/email/preview'
import { SAMPLE_PREVIEW_LEAD } from '@/lib/email/template-variables'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * When provided, the sheet opens preselected to this template (entry from
   * the Templates page's "Send Blast" row action). When null/undefined, the
   * user picks a template from the inline dropdown (entry from a Campaign's
   * Blast Action menu).
   */
  template?: EmailTemplate | null
  /**
   * When provided, recipients are scoped to leads belonging to this campaign.
   * Without it, the picker spans every lead in the client.
   */
  campaignId?: string
  // Called once the blast is accepted by the backend.
  onJobCreated?: (jobId: string) => void
}

type ScheduleMode = 'now' | 'later'

export function EmailBlastSheet({
  open,
  onOpenChange,
  template,
  campaignId,
  onJobCreated,
}: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [accountId, setAccountId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [subject, setSubject] = useState('')
  // Editable HTML body. Initialized from the picked template's html and
  // optionally tweaked before send. If body !== activeTemplate.html on
  // submit, we send it as `htmlOverride`.
  const [body, setBody] = useState('')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [delaySeconds, setDelaySeconds] = useState(5)

  const { data: accounts, isLoading: loadingAccounts } = useEmailAccounts()
  const { data: leadsData, isLoading: loadingLeads } = useLeads({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    campaignId,
  })
  // Fetch templates only when the sheet is open and we don't already have a
  // preset template — the latter case means the user came from the Templates
  // page and shouldn't need to re-pick.
  const templatesEnabled = open && !template
  const { data: templatesPage, isLoading: loadingTemplates } =
    useEmailTemplates(templatesEnabled ? { page: 1, limit: 100 } : {})
  const templates = templatesEnabled ? templatesPage?.data ?? [] : []
  const activeTemplate = useMemo(() => {
    if (template) return template
    return templates.find((t) => t.id === selectedTemplateId) ?? null
  }, [template, templates, selectedTemplateId])

  const { mutate: sendBlast, isPending: isSending } =
    useSendEmailBlast(accountId || null)

  // Reset on open and prefill from the preset template if any.
  useEffect(() => {
    if (!open) return
    setPage(1)
    setSearch('')
    setSelectedIds(new Set())
    setSelectedTemplateId(template?.id ?? '')
    setSubject(template?.subject ?? '')
    setBody(template?.html ?? '')
    setScheduleMode('now')
    setScheduledAt('')
    setDelaySeconds(5)
    if (accounts && accounts.length === 1) {
      setAccountId(accounts[0].id)
    } else if (!accounts?.find((a) => a.id === accountId)) {
      setAccountId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template])

  // When the user picks a template inside the sheet, prefill the subject from
  // that template (overrides any prior subject so the picker feels obviously
  // applied).
  const handlePickTemplate = (id: string) => {
    setSelectedTemplateId(id)
    const tpl = templates.find((t) => t.id === id)
    if (tpl) {
      setSubject(tpl.subject)
      setBody(tpl.html)
    }
  }

  // Clear the user's template selection and reset subject/body. Only used
  // when the parent didn't preset a template (i.e. campaign-driven flow);
  // when a template is preset, the close button is the way out.
  const handleClearTemplate = () => {
    setSelectedTemplateId('')
    setSubject('')
    setBody('')
  }

  const leadsWithEmail = useMemo(
    () => (leadsData?.data ?? []).filter((l) => !!l.email),
    [leadsData],
  )
  const leadsWithoutEmailCount = useMemo(
    () => (leadsData?.data ?? []).length - leadsWithEmail.length,
    [leadsData, leadsWithEmail],
  )

  const allOnPageSelected =
    leadsWithEmail.length > 0 &&
    leadsWithEmail.every((l) => selectedIds.has(l.id))
  const someOnPageSelected =
    leadsWithEmail.some((l) => selectedIds.has(l.id)) && !allOnPageSelected

  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        leadsWithEmail.forEach((l) => next.delete(l.id))
      } else {
        leadsWithEmail.forEach((l) => next.add(l.id))
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    if (!activeTemplate) {
      toast.error(
        t('email.blast.templateRequired', 'Pick an email template first.'),
      )
      return
    }
    if (!accountId) {
      toast.error(
        t(
          'email.blast.accountRequired',
          'Pick an email account to send from.',
        ),
      )
      return
    }
    if (selectedIds.size === 0) {
      toast.error(
        t(
          'email.blast.recipientsRequired',
          'Select at least one recipient.',
        ),
      )
      return
    }
    if (scheduleMode === 'later') {
      if (!scheduledAt) {
        toast.error(
          t(
            'email.blast.scheduleRequired',
            'Pick a date and time to schedule the blast.',
          ),
        )
        return
      }
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        toast.error(
          t(
            'email.blast.scheduleInPast',
            'Scheduled time must be in the future.',
          ),
        )
        return
      }
    }

    sendBlast(
      {
        templateId: activeTemplate.id,
        leadIds: Array.from(selectedIds),
        subjectOverride:
          subject && subject !== activeTemplate.subject ? subject : undefined,
        htmlOverride:
          body && body !== activeTemplate.html ? body : undefined,
        delaySeconds,
        scheduledAt:
          scheduleMode === 'later'
            ? new Date(scheduledAt).toISOString()
            : undefined,
      },
      {
        onSuccess: (resp) => {
          toast.success(
            t(
              'email.blast.queued',
              'Blast queued: sending to {{n}} recipient(s).',
              { n: resp.totalRecipients },
            ),
          )
          if (resp.skipped.length > 0) {
            toast.info(
              t(
                'email.blast.skippedSummary',
                '{{n}} lead(s) were skipped (missing or invalid email).',
                { n: resp.skipped.length },
              ),
            )
          }
          onJobCreated?.(resp.jobId)
          onOpenChange(false)
        },
        onError: (err) => {
          toast.error(
            err.message ||
              t('email.blast.failed', 'Failed to start email blast'),
          )
        },
      },
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && isSending) return
        onOpenChange(o)
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">
            {t('email.blast.title', 'Send Email Blast')}
          </SheetTitle>
          <SheetDescription>
            {template
              ? t(
                  'email.blast.subtitle',
                  'Sending template "{{name}}". Pick recipients, then send.',
                  { name: template.name },
                )
              : t(
                  'email.blast.subtitleNoTemplate',
                  'Pick a template, choose your recipients, and send.',
                )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* 1. Template (only when not preset by the parent) */}
          {!template && (
            <section className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wide">
                {t('email.blast.template', 'Template')}
              </Label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.loading', 'Loading…')}
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-destructive">
                  {t(
                    'email.blast.noTemplates',
                    'No saved email templates. Create one first.',
                  )}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedTemplateId}
                      onValueChange={handlePickTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'email.blast.selectTemplate',
                            'Pick a template…',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            <span className="font-medium">{tpl.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {tpl.subject}
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
                      title={t(
                        'email.blast.clearTemplate',
                        'Clear template selection',
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.clear', 'Clear')}
                    </Button>
                  )}
                </div>
              )}
            </section>
          )}

          {/* 2. Account */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wide">
              {t('email.blast.fromAccount', 'Send from')}
            </Label>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading', 'Loading…')}
              </div>
            ) : (accounts ?? []).length === 0 ? (
              <p className="text-sm text-destructive">
                {t(
                  'email.blast.noAccounts',
                  'No connected email accounts. Connect one first.',
                )}
              </p>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'email.blast.selectAccount',
                      'Pick an account…',
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </section>

          {/* 2. Subject (override) */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wide">
              {t('email.blast.subject', 'Subject')}
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={activeTemplate?.subject ?? ''}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                'email.blast.subjectHint',
                'Variables like {leadName} are replaced per recipient.',
              )}
            </p>
          </section>

          {/* 3. Body — preview the chosen template's HTML and edit it
                inline if needed. Hidden until a template is active. */}
          {activeTemplate && (
            <section className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wide">
                {t('email.blast.body', 'Email body')}
              </Label>
              <Tabs defaultValue="preview">
                <TabsList className="mb-2">
                  <TabsTrigger value="preview">
                    {t('email.blast.tabPreview', 'Preview')}
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    {t('email.blast.tabEdit', 'Edit HTML')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-0">
                  <HtmlEmailFrame
                    html={renderPreview(body, SAMPLE_PREVIEW_LEAD)}
                    className="w-full min-h-[280px] max-h-[60vh] bg-white rounded border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t(
                      'email.blast.previewHint',
                      'Showing sample data — recipients will see their own values.',
                    )}
                  </p>
                </TabsContent>
                <TabsContent value="edit" className="mt-0">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-[280px] font-mono text-xs resize-y"
                    spellCheck={false}
                    placeholder={t(
                      'email.blast.bodyPlaceholder',
                      'Edit the HTML body for this blast…',
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t(
                      'email.blast.bodyHint',
                      'Edits apply to this blast only — your saved template is not modified. Variables like {firstName} are replaced per recipient.',
                    )}
                  </p>
                </TabsContent>
              </Tabs>
            </section>
          )}

          {/* 4. Recipients */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold uppercase tracking-wide">
                {t('email.blast.recipients', 'Recipients')}
              </Label>
              <Badge variant="secondary">
                {selectedIds.size}{' '}
                {t('email.blast.selected', 'selected')}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={t(
                  'email.blast.searchLeads',
                  'Search leads by name, phone, or email…',
                )}
                className="pl-8"
              />
            </div>

            {leadsWithoutEmailCount > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-2 py-1.5 text-xs flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'email.blast.skippedNoEmail',
                    '{{n}} lead(s) on this page have no email and are not selectable.',
                    { n: leadsWithoutEmailCount },
                  )}
                </span>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allOnPageSelected
                            ? true
                            : someOnPageSelected
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={togglePage}
                        disabled={leadsWithEmail.length === 0}
                        aria-label={t(
                          'email.blast.selectAllPage',
                          'Select all on page',
                        )}
                      />
                    </TableHead>
                    <TableHead>{t('leads.name', 'Name')}</TableHead>
                    <TableHead>{t('leads.email', 'Email')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLeads ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center">
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      </TableCell>
                    </TableRow>
                  ) : (leadsData?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-20 text-center text-muted-foreground"
                      >
                        {t('leads.noLeadsFound', 'No leads found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    leadsData?.data.map((lead) => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        selected={selectedIds.has(lead.id)}
                        onToggle={() => toggleOne(lead.id)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
              {leadsData && (
                <StandardPagination
                  currentPage={page}
                  totalPages={leadsData.meta.totalPages}
                  totalItems={leadsData.meta.total}
                  itemsPerPage={20}
                  onPageChange={setPage}
                />
              )}
            </div>
          </section>

          {/* 4. Schedule */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wide">
              {t('email.blast.schedule', 'Schedule')}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={scheduleMode === 'now' ? 'default' : 'outline'}
                onClick={() => setScheduleMode('now')}
              >
                {t('email.blast.sendNow', 'Send now')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={scheduleMode === 'later' ? 'default' : 'outline'}
                onClick={() => setScheduleMode('later')}
              >
                {t('email.blast.scheduleLater', 'Schedule')}
              </Button>
            </div>
            {scheduleMode === 'later' && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            )}
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-xs text-muted-foreground shrink-0">
                {t('email.blast.delay', 'Delay between sends (seconds)')}
              </Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={delaySeconds}
                onChange={(e) =>
                  setDelaySeconds(
                    Math.max(0, Math.min(60, Number(e.target.value) || 0)),
                  )
                }
                className="w-24 h-8"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSending || !activeTemplate || selectedIds.size === 0}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {scheduleMode === 'later'
              ? t('email.blast.scheduleAction', 'Schedule blast')
              : t('email.blast.sendAction', 'Send blast')}{' '}
            ({selectedIds.size})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LeadRow({
  lead,
  selected,
  onToggle,
}: {
  lead: Lead
  selected: boolean
  onToggle: () => void
}) {
  const hasEmail = !!lead.email
  return (
    <TableRow
      className={hasEmail ? 'cursor-pointer' : 'opacity-60'}
      onClick={hasEmail ? onToggle : undefined}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          disabled={!hasEmail}
          aria-label={`Select ${lead.leadName}`}
        />
      </TableCell>
      <TableCell className="font-medium">{lead.leadName}</TableCell>
      <TableCell className="text-sm">
        {lead.email ? (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {lead.email}
          </span>
        ) : (
          <span className="text-muted-foreground italic">
            (no email)
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

