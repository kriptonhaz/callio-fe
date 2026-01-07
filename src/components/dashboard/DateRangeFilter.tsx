import { useState, useMemo, createContext, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'

export type DateRangeType = 'today' | 'week' | 'month' | 'custom'

export interface DateRange {
  startDate?: string
  endDate?: string
}

interface DateRangeContextValue {
  dateRangeType: DateRangeType
  setDateRangeType: (type: DateRangeType) => void
  dateRange: DateRange
  customStartDate?: Date
  customEndDate?: Date
  setCustomStartDate: (date: Date | undefined) => void
  setCustomEndDate: (date: Date | undefined) => void
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext)
  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider')
  }
  return context
}

interface DateRangeProviderProps {
  children: React.ReactNode
}

export function DateRangeProvider({
  children,
}: DateRangeProviderProps): React.ReactElement {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('month')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()

  const dateRange = useMemo(() => {
    const today = new Date()
    const endDate = format(today, 'yyyy-MM-dd')

    switch (dateRangeType) {
      case 'today':
        return {
          startDate: format(startOfDay(today), 'yyyy-MM-dd'),
          endDate,
        }
      case 'week':
        return {
          startDate: format(
            startOfWeek(today, { weekStartsOn: 1 }),
            'yyyy-MM-dd',
          ),
          endDate,
        }
      case 'month':
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate,
        }
      case 'custom':
        return {
          startDate: customStartDate
            ? format(customStartDate, 'yyyy-MM-dd')
            : undefined,
          endDate: customEndDate
            ? format(customEndDate, 'yyyy-MM-dd')
            : undefined,
        }
      default:
        return { startDate: undefined, endDate: undefined }
    }
  }, [dateRangeType, customStartDate, customEndDate])

  return (
    <DateRangeContext.Provider
      value={{
        dateRangeType,
        setDateRangeType,
        dateRange,
        customStartDate,
        customEndDate,
        setCustomStartDate,
        setCustomEndDate,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  )
}

export function DateRangeFilter(): React.ReactElement {
  const { t } = useTranslation()
  const {
    dateRangeType,
    setDateRangeType,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
  } = useDateRange()

  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
      <Button
        variant={dateRangeType === 'today' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setDateRangeType('today')}
        className="h-8"
      >
        {t('dashboard.today', 'Today')}
      </Button>
      <Button
        variant={dateRangeType === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setDateRangeType('week')}
        className="h-8"
      >
        {t('dashboard.thisWeek', 'This Week')}
      </Button>
      <Button
        variant={dateRangeType === 'month' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setDateRangeType('month')}
        className="h-8"
      >
        {t('dashboard.thisMonth', 'This Month')}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={dateRangeType === 'custom' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 gap-1"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {t('dashboard.pickDateRange', 'Pick Range')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('common.startDate', 'Start Date')}
                </label>
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => {
                    setCustomStartDate(date)
                    setDateRangeType('custom')
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('common.endDate', 'End Date')}
                </label>
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => {
                    setCustomEndDate(date)
                    setDateRangeType('custom')
                  }}
                  disabled={(date) => {
                    if (date > new Date()) return true
                    if (customStartDate && date < customStartDate) return true
                    return false
                  }}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
