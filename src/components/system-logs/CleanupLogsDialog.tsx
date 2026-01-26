import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface CleanupLogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (date: Date) => void
  isPending: boolean
}

export function CleanupLogsDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CleanupLogsDialogProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState<Date>()

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!date) {
      toast.error(t('systemLogs.cleanup.dateRequired', 'Please select a date'))
      return
    }
    onConfirm(date)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('systemLogs.cleanup.title', 'Cleanup System Logs')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              {t(
                'systemLogs.cleanup.description',
                'Select a date to delete all logs created before that date. This action cannot be undone.',
              )}
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {t('systemLogs.cleanup.deleteBefore', 'Delete logs before:')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('common.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending || !date}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {t('common.cleanup', 'Cleanup')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
