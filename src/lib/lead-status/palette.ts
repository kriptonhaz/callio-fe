import type { LeadStatusColor } from '@/lib/api/types/lead-status-options.types'
import { LEAD_STATUS_COLORS } from '@/lib/api/types/lead-status-options.types'

export { LEAD_STATUS_COLORS }
export type { LeadStatusColor }

export const colorClasses: Record<LeadStatusColor, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-transparent',
  yellow:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-transparent',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-transparent',
  green:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent',
  purple:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-transparent',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-transparent',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-transparent',
  slate:
    'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-transparent',
}

export const colorSwatches: Record<LeadStatusColor, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  slate: 'bg-slate-500',
}
