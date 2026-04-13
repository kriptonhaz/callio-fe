import { PhoneForwarded, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  secondsLeft: number
  totalSeconds: number
  onCancel: () => void
  autoDial?: boolean
}

export function AutoAdvanceBanner({
  secondsLeft,
  totalSeconds,
  onCancel,
  autoDial,
}: Props) {
  const pct = Math.max(
    0,
    Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100),
  )

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] w-[360px] animate-in slide-in-from-right fade-in rounded-lg border-2 border-amber-400 bg-background shadow-2xl"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          {autoDial ? (
            <PhoneForwarded className="h-5 w-5" />
          ) : (
            <Timer className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">
            {autoDial
              ? 'Advancing and dialing next lead'
              : 'Advancing to next lead'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            In{' '}
            <span className="font-bold text-foreground tabular-nums">
              {secondsLeft}s
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 pb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="gap-1.5 border-amber-400 hover:bg-amber-50 hover:text-amber-900"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-b-lg bg-amber-100">
        <div
          className="h-full bg-amber-500 transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
