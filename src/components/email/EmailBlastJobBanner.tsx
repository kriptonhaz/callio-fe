import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react'
import { useEmailBlastJob } from '@/hooks/api/useEmailTemplates'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Props {
  jobId: string
  onDismiss: () => void
}

// Polls the blast job and shows progress (sent / total). Auto-stops polling
// once the job reaches a terminal state. Caller can dismiss anytime.
export function EmailBlastJobBanner({ jobId, onDismiss }: Props) {
  const { t } = useTranslation()
  const { data, isLoading } = useEmailBlastJob(jobId)

  const status = data?.status
  const total = data?.total ?? 0
  const sent = data?.sent ?? 0
  const failed = data?.failed ?? 0
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0

  const isTerminal =
    status === 'completed' || status === 'failed' || status === 'cancelled'
  const isFailed = status === 'failed'
  const isCompleted = status === 'completed'

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-md border px-4 py-3',
        isFailed
          ? 'border-destructive/40 bg-destructive/5'
          : isCompleted
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-primary/30 bg-primary/5',
      ].join(' ')}
    >
      {isLoading || (!isTerminal && status !== undefined) ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      ) : isFailed ? (
        <XCircle className="h-4 w-4 text-destructive shrink-0" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {isCompleted
            ? t('email.blast.banner.completed', 'Email blast completed')
            : isFailed
              ? t('email.blast.banner.failed', 'Email blast failed')
              : status === 'queued'
                ? t('email.blast.banner.queued', 'Email blast queued…')
                : t('email.blast.banner.sending', 'Sending email blast…')}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {t(
            'email.blast.banner.progress',
            '{{sent}} of {{total}} sent',
            { sent, total },
          )}
          {failed > 0 && (
            <span className="ml-2 text-destructive">
              ·{' '}
              {t('email.blast.banner.failedCount', '{{n}} failed', {
                n: failed,
              })}
            </span>
          )}
        </div>
        {!isTerminal && total > 0 && (
          <Progress value={pct} className="h-1.5 mt-2" />
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={onDismiss}
        className="h-7 w-7 shrink-0"
        aria-label={t('common.dismiss', 'Dismiss')}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
