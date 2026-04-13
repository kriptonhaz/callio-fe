import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLeadStatusOptions } from '@/hooks/api/useLeadStatusOptions'
import { ALL_FILTER_VALUE, humanizeSlug } from '@/lib/lead-status/constants'

interface BaseProps {
  className?: string
  placeholder?: string
  /**
   * When true, an "All" option is rendered with value ALL_FILTER_VALUE ('all').
   * Use for filter dropdowns. Default false (write surface).
   */
  includeAll?: boolean
  /**
   * When true, deactivated options also appear in the list (greyed, suffixed).
   * Use for edit forms where the assignment may already reference a deactivated slug.
   */
  includeInactive?: boolean
  disabled?: boolean
}

interface ValueProps extends BaseProps {
  value: string
  onValueChange: (value: string) => void
}

export function LeadStatusSelect({
  value,
  onValueChange,
  className,
  placeholder,
  includeAll,
  includeInactive,
  disabled,
}: ValueProps) {
  const { data: options } = useLeadStatusOptions()

  const visible = useMemo(() => {
    const list = options ?? []
    return includeInactive ? list : list.filter((o) => o.isActive)
  }, [options, includeInactive])

  const knownSlugs = useMemo(
    () => new Set((options ?? []).map((o) => o.slug)),
    [options],
  )

  // If the current value isn't in the visible list (e.g. deactivated and
  // includeInactive=false), surface it inline so the user can still see/replace it.
  const orphaned =
    value &&
    value !== ALL_FILTER_VALUE &&
    !visible.some((o) => o.slug === value)
      ? {
          slug: value,
          label: humanizeSlug(value),
          isKnown: knownSlugs.has(value),
        }
      : null

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder ?? 'Select status'} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>}
        {visible.map((opt) => (
          <SelectItem key={opt.slug} value={opt.slug}>
            {opt.label}
          </SelectItem>
        ))}
        {orphaned && (
          <SelectItem value={orphaned.slug} className="text-muted-foreground">
            {orphaned.label}
            {orphaned.isKnown ? ' (deactivated)' : ' (unknown)'}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
