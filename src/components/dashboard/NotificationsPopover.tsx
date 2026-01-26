import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AnimateIcon } from '@/components/animate-ui/icons/icon'
import { cn } from '@/lib/utils'
import { NotificationDetailsSheet } from '@/components/dashboard/NotificationDetailsSheet'
import { Notification } from '@/lib/api/types/notifications.types'

import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/api/useNotifications'

export function NotificationsPopover() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { data, isLoading } = useNotifications({
    limit: 3,
  })

  const { mutate: markAllRead, isPending: isMarkingRead } =
    useMarkAllNotificationsRead()

  const unreadCount = data?.meta.unreadCount || 0
  const notifications = data?.data || []

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        // Optional: Close popover or show toast
      },
    })
  }

  const { mutate: markAsRead } = useMarkNotificationRead()

  const handleViewAll = () => {
    setOpen(false)
    navigate({ to: '/dashboard/notifications', search: { page: 1, limit: 10 } })
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    setSelectedNotification(notification)
    setIsDetailsOpen(true)
    // Keep popover open? Or close it? Usually closing popover is better UX if opening a sheet.
    // However, the sheet is "global" level (on top).
    // Let's close popover for cleaner view.
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative inline-block">
            <AnimateIcon animateOnHover asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </AnimateIcon>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 pb-2">
            <h4 className="font-semibold leading-none">
              {t('notifications.title', 'Notifications')}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {t('notifications.markAllRead', 'Mark all as read')}
            </Button>
          </div>
          <Separator />
          <ScrollArea className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('common.loading', 'Loading...')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {t('notifications.empty', 'No notifications')}
              </div>
            ) : (
              <div className="grid gap-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50 cursor-pointer',
                      !notification.isRead && 'bg-muted/20',
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-sm">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs"
              onClick={handleViewAll}
            >
              {t('notifications.viewAll', 'View all notifications')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <NotificationDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        notification={selectedNotification}
      />
    </>
  )
}
