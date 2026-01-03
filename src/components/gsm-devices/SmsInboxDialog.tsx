import { useTranslation } from 'react-i18next'
import { useSmsInbox } from '@/hooks/api/useGsmDevices'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Inbox } from 'lucide-react'

interface SmsInboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  portNumber: number
}

interface SmsMessage {
  time: string
  sender: string
  message: string
}

interface SmsInboxResponse {
  line: number
  messageCount: number
  messages: SmsMessage[]
}

export function SmsInboxDialog({
  open,
  onOpenChange,
  deviceId,
  portNumber,
}: SmsInboxDialogProps) {
  const { t } = useTranslation()
  const { data: inboxData, isLoading } = useSmsInbox(deviceId, portNumber, open)

  const smsInbox = inboxData as SmsInboxResponse | undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('gsmDevices.smsInbox.title', 'SMS Inbox')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'gsmDevices.smsInbox.description',
              'Port {{port}} - {{count}} messages',
              { port: portNumber, count: smsInbox?.messageCount || 0 },
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-primary w-[140px]">
                      {t('gsmDevices.smsInbox.dateTime', 'Date/Time')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary w-[150px]">
                      {t('gsmDevices.smsInbox.sender', 'Sender')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('gsmDevices.smsInbox.message', 'Message')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsInbox?.messages && smsInbox.messages.length > 0 ? (
                    smsInbox.messages.map((sms, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs">
                          {sms.time}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sms.sender}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap">
                          {sms.message}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        {t('gsmDevices.smsInbox.empty', 'No messages found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
