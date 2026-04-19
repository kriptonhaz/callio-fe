import { format, isToday, isYesterday } from 'date-fns'

export interface SmartDateLabels {
  today?: string
  yesterday?: string
}

/**
 * Smart relative-ish date formatter:
 * - Today ➝ "Today HH:mm"
 * - Yesterday ➝ "Yesterday HH:mm"
 * - Older ➝ "dd MMM yyyy HH:mm"
 *
 * Caller supplies already-translated labels for today/yesterday; falls back to
 * English when labels are not provided.
 */
export function formatSmartDate(
  iso: string | null | undefined,
  labels?: SmartDateLabels,
): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const today = labels?.today ?? 'Today'
    const yesterday = labels?.yesterday ?? 'Yesterday'
    if (isToday(d)) return `${today} ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `${yesterday} ${format(d, 'HH:mm')}`
    return format(d, 'dd MMM yyyy HH:mm')
  } catch {
    return ''
  }
}
