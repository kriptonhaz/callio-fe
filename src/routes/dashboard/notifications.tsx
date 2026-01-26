import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/api/useNotifications'
import { Notification } from '@/lib/api/types/notifications.types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StandardPagination } from '@/components/common/StandardPagination'
import { NotificationDetailsSheet } from '@/components/dashboard/NotificationDetailsSheet'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NotificationsSearch {
  page: number
  limit: number
}

export const Route = createFileRoute('/dashboard/notifications')({
  component: NotificationsPage,
  validateSearch: (search: Record<string, unknown>): NotificationsSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
    }
  },
})

function NotificationsPage() {
  const { t } = useTranslation()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotifications({
    page: searchParams.page || 1,
    limit: searchParams.limit || 10,
    // search: debouncedSearch, // Assuming API supports search, if not, remove
  })

  // Mark all as read mutation
  const { mutate: markAllRead, isPending: isMarkingRead } =
    useMarkAllNotificationsRead()

  const { mutate: markAsRead } = useMarkNotificationRead()

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleMarkAllRead = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        toast.success(
          t('notifications.markedAllRead', 'All notifications marked as read'),
        )
        refetch()
      },
      onError: () => {
        toast.error(t('common.error', 'Something went wrong'))
      },
    })
  }

  const handleRowClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setSelectedNotification(notification)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t('notifications.title', 'Notifications')}
        </h1>
        <Button
          variant="outline"
          onClick={handleMarkAllRead}
          disabled={isMarkingRead || notificationsData?.meta.unreadCount === 0}
        >
          {isMarkingRead ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="mr-2 h-4 w-4" />
          )}
          {t('notifications.markAllRead', 'Mark all as read')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.list', 'All Notifications')}
            </CardTitle>
            {/* Search (Optional if API supports it) */}
            {/* 
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('notifications.search', 'Search notifications...')}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div> 
            */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{t('notifications.message', 'Message')}</TableHead>
                  <TableHead>
                    {t('notifications.category', 'Category')}
                  </TableHead>
                  <TableHead>{t('notifications.date', 'Date')}</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('common.loading', 'Loading...')}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : notificationsData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Bell className="h-8 w-8 opacity-20" />
                        <p>
                          {t('notifications.empty', 'No notifications found')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notificationsData?.data.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        !notification.isRead && 'bg-muted/20 font-medium',
                      )}
                      onClick={() => handleRowClick(notification)}
                    >
                      <TableCell>
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full mx-auto',
                            !notification.isRead
                              ? 'bg-blue-500'
                              : 'bg-transparent',
                          )}
                        />
                      </TableCell>
                      <TableCell className="max-w-[300px] md:max-w-[400px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm truncate">
                            {notification.title}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {notification.message}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {notification.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(notification.createdAt), 'MMM d, p')}
                      </TableCell>
                      <TableCell>{/* Optional actions if needed */}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {notificationsData && (
              <StandardPagination
                currentPage={searchParams.page || 1}
                totalPages={notificationsData.meta.totalPages}
                totalItems={notificationsData.meta.total}
                itemsPerPage={searchParams.limit || 10}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        notification={selectedNotification}
      />
    </div>
  )
}
