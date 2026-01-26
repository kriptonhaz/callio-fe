import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { Bell, User, Clock, Tag, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Notification } from '@/lib/api/types/notifications.types'
import { cn } from '@/lib/utils'

interface NotificationDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification: Notification | null
}

export function NotificationDetailsSheet({
  open,
  onOpenChange,
  notification,
}: NotificationDetailsSheetProps) {
  const { t } = useTranslation()

  if (!notification) return null

  const getStatusBadge = (type: string) => {
    const styles = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }

    const style = styles[type as keyof typeof styles] || styles.info
    return (
      <Badge variant="outline" className={cn('capitalize', style)}>
        {type}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('notifications.details', 'Notification Details')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'notifications.detailsDescription',
              'View full details of this notification.',
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold leading-tight">
                {notification.title}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/50">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(notification.createdAt), 'PPP p')}
                  </span>
                </div>
                {getStatusBadge(notification.type)}
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {notification.category}
                </Badge>
              </div>
            </div>

            {/* Sender / Role Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20 border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t('notifications.sender', 'Sender')}
                </span>
                <p className="text-sm font-medium">
                  {notification.user?.name || 'System'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t('notifications.status', 'Status')}
                </span>
                <p className="text-sm font-medium flex items-center gap-2">
                  {notification.isRead ? (
                    <span className="text-muted-foreground">Read</span>
                  ) : (
                    <span className="flex items-center text-blue-500">
                      <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                      Unread
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-2 flex flex-col flex-1 min-h-0">
              <h4 className="text-sm font-medium text-foreground">
                {t('notifications.message', 'Message Content')}
              </h4>
              <ScrollArea className="h-[300px] w-full rounded-lg border bg-card">
                <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {notification.message}
                </div>
              </ScrollArea>
            </div>

            {/* Payload (if any) */}
            {/* 
            {notification.payload && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Payload</h4>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 text-xs overflow-x-auto">
                  {JSON.stringify(notification.payload, null, 2)}
                </pre>
              </div>
            )} 
            */}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
