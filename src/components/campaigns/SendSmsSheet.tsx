import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useComposeSms, useSendSmsToPhone } from '@/hooks/api/useSms'

export interface MaskingOption {
  id: string
  name: string
}

// Discriminated union — either we send to a tracked lead-assignment (default
// Work Mode flow), or to an arbitrary phone (emergency contact). Both paths
// share the same masking + message UX; the difference is just which endpoint
// the submit hits.
export type SmsTarget =
  | {
      mode: 'leadAssignment'
      leadAssignmentId: string
      name: string
      phone?: string
    }
  | {
      mode: 'phone'
      phone: string
      name: string
      // Optional context — passed to the BE for reporting attribution.
      relatedLeadId?: string
      relatedLeadAssignmentId?: string
    }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  target: SmsTarget
  maskingOptions: ReadonlyArray<MaskingOption>
  defaultMaskingId?: string
}

const MAX_LENGTH = 1000

/**
 * Single-recipient SMS dialog for Work Mode. Hits the same compose endpoint
 * the campaign-level bulk SMS uses (`POST /api/sms/campaigns/:id/compose`)
 * but with a leadAssignmentIds array of length 1 (the current lead) and
 * timing 'now'.
 */
export function SendSmsSheet({
  open,
  onOpenChange,
  campaignId,
  target,
  maskingOptions,
  defaultMaskingId,
}: Props) {
  const { t } = useTranslation()
  const composeMut = useComposeSms()
  const sendToPhoneMut = useSendSmsToPhone()
  const isPending = composeMut.isPending || sendToPhoneMut.isPending

  const targetName = target.name
  const targetPhone =
    target.mode === 'leadAssignment' ? target.phone : target.phone

  const initialMaskingId =
    defaultMaskingId ||
    (maskingOptions.length === 1 ? maskingOptions[0].id : '')

  const [maskingId, setMaskingId] = useState(initialMaskingId)
  const [message, setMessage] = useState('')

  // Reset state on open / when defaults change.
  useEffect(() => {
    if (open) {
      setMaskingId(initialMaskingId)
      setMessage('')
    }
  }, [open, initialMaskingId])

  const remaining = MAX_LENGTH - message.length
  const overLimit = remaining < 0

  const handleSubmit = async () => {
    if (!maskingId) {
      toast.error(
        t('campaigns.smsMaskingRequired', 'Pick a masking number first.'),
      )
      return
    }
    if (!message.trim()) {
      toast.error(
        t('campaigns.smsMessageRequired', 'Message can\'t be empty.'),
      )
      return
    }
    if (overLimit) {
      toast.error(
        t('campaigns.smsTooLong', 'Message exceeds the maximum length.'),
      )
      return
    }
    try {
      if (target.mode === 'leadAssignment') {
        await composeMut.mutateAsync({
          campaignId,
          data: {
            message,
            maskingId,
            timing: 'now',
            leadAssignmentIds: [target.leadAssignmentId],
          },
        })
      } else {
        await sendToPhoneMut.mutateAsync({
          campaignId,
          data: {
            message,
            maskingId,
            timing: 'now',
            phone: target.phone,
            relatedLeadId: target.relatedLeadId,
            relatedLeadAssignmentId: target.relatedLeadAssignmentId,
          },
        })
      }
      toast.success(
        t('campaigns.smsSentSuccess', 'SMS sent successfully'),
      )
      onOpenChange(false)
    } catch {
      toast.error(t('campaigns.smsError', 'Failed to send SMS'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            {t('campaigns.sendSms', 'Send SMS')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'campaigns.sendSmsDesc',
              'Send a single SMS to {{name}}{{phone}}.',
              {
                name: targetName,
                phone: targetPhone ? ` (${targetPhone})` : '',
              },
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {t('campaigns.maskingNumber', 'Masking Number')}
            </Label>
            {maskingOptions.length === 0 ? (
              <p className="text-sm text-destructive">
                {t(
                  'campaigns.smsNoMasking',
                  'No active masking numbers available. Configure one in Settings → Masking.',
                )}
              </p>
            ) : (
              <Select
                value={maskingId}
                onValueChange={setMaskingId}
                disabled={maskingOptions.length === 1}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'campaigns.selectMasking',
                      'Pick a masking number…',
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {maskingOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {t('campaigns.message', 'Message')}
              </Label>
              <span
                className={
                  overLimit
                    ? 'text-xs font-medium text-destructive'
                    : 'text-xs text-muted-foreground'
                }
              >
                {remaining}
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                'campaigns.smsPlaceholder',
                'Type your message here…',
              )}
              className="min-h-[160px] resize-y"
              maxLength={MAX_LENGTH + 50}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                'campaigns.smsMergeTagsHint',
                'Variables like {leadName}, {firstName}, {phone} are replaced before send.',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isPending ||
              !maskingId ||
              !message.trim() ||
              overLimit ||
              maskingOptions.length === 0
            }
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('campaigns.sendSms', 'Send SMS')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
