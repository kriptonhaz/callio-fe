import { useMemo } from 'react'
import { useLeadStatusOptions } from '@/hooks/api/useLeadStatusOptions'
import { colorClasses } from '@/lib/lead-status/palette'
import { humanizeSlug } from '@/lib/lead-status/constants'
import { cn } from '@/lib/utils'

interface Props {
  slug: string | null | undefined
  className?: string
}

export function LeadStatusBadge({ slug, className }: Props) {
  const { data: options } = useLeadStatusOptions()

  const resolved = useMemo(() => {
    if (!slug) return null
    return options?.find((o) => o.slug === slug) ?? null
  }, [slug, options])

  if (!slug) {
    return <span className="text-muted-foreground">—</span>
  }

  const colorClass = resolved
    ? colorClasses[resolved.color]
    : 'bg-muted text-muted-foreground border-transparent'
  const label = resolved?.label ?? humanizeSlug(slug)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  )
}
