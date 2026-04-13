import { Timer, X } from 'lucide-react'
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
    <div className="relative overflow-hidden rounded-md border border-amber-200 bg-amber-50 text-amber-900">
      <div
        className="absolute inset-y-0 left-0 bg-amber-200/60 transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 shrink-0" />
          <span>
            {autoDial
              ? `Auto-advancing and dialing next lead in ${secondsLeft}s…`
              : `Auto-advancing to next lead in ${secondsLeft}s…`}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 gap-1 text-amber-900 hover:bg-amber-200/60 hover:text-amber-900"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
