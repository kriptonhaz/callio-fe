import { Check } from 'lucide-react'
import type { LeadStatusColor } from '@/lib/api/types/lead-status-options.types'
import { LEAD_STATUS_COLORS, colorSwatches } from '@/lib/lead-status/palette'
import { cn } from '@/lib/utils'

interface Props {
  value: LeadStatusColor
  onChange: (color: LeadStatusColor) => void
  disabled?: boolean
}

export function ColorSwatchPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {LEAD_STATUS_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={value === c}
          disabled={disabled}
          onClick={() => onChange(c)}
          className={cn(
            'h-7 w-7 rounded-full transition ring-offset-background',
            colorSwatches[c],
            value === c
              ? 'ring-2 ring-offset-2 ring-foreground scale-110'
              : 'opacity-70 hover:opacity-100',
            disabled && 'cursor-not-allowed opacity-40',
          )}
        >
          {value === c && (
            <Check className="h-3.5 w-3.5 text-white mx-auto drop-shadow" />
          )}
        </button>
      ))}
    </div>
  )
}
