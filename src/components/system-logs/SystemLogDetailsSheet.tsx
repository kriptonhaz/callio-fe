import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

import { Separator } from '@/components/ui/separator'
import { SystemLog } from '@/lib/api/types/system-logs.types'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { User, Monitor, Globe, Code, Calendar, Shield } from 'lucide-react'

interface SystemLogDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: SystemLog | null
}

export function SystemLogDetailsSheet({
  open,
  onOpenChange,
  log,
}: SystemLogDetailsSheetProps) {
  const { t } = useTranslation()

  if (!log) return null

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('systemLogs.details.title', 'Log Details')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'systemLogs.details.description',
              'Detailed audit log information.',
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Action & Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t('systemLogs.details.action', 'Action')}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold break-all">
                  {log.action}
                </span>
                {log.metadata?.method && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {log.metadata.method}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(log.createdAt), 'PPP pp')}
              </div>
            </div>

            <Separator />

            {/* User Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('systemLogs.details.user', 'User')}
              </h3>
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t('systemLogs.details.name', 'Name')}:
                  </span>
                  <span className="col-span-2 font-medium">
                    {log.user?.name || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t('systemLogs.details.email', 'Email')}:
                  </span>
                  <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">
                    {log.user?.email || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="col-span-2 font-mono text-xs text-muted-foreground break-all">
                    {log.userId}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('systemLogs.details.request', 'Request')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground block">
                    {t('systemLogs.details.ip', 'IP Address')}
                  </span>
                  <span className="font-mono text-sm">
                    {log.metadata?.ip || '-'}
                  </span>
                </div>
                {/* Add User Agent if available */}
                {log.metadata?.userAgent && (
                  <div className="bg-muted/30 p-3 rounded-lg space-y-1 md:col-span-2">
                    <span className="text-xs text-muted-foreground block flex items-center gap-1">
                      <Monitor className="h-3 w-3" /> User Agent
                    </span>
                    <span className="text-xs text-muted-foreground break-all">
                      {log.metadata.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Metadata / Payloads */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Code className="h-4 w-4" />
                {t('systemLogs.details.metadata', 'Metadata')}
              </h3>

              {log.metadata?.body && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground ml-1">
                    Body
                  </span>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-x-auto text-[10px] font-mono leading-relaxed">
                    <pre>{formatJson(log.metadata.body)}</pre>
                  </div>
                </div>
              )}

              {log.metadata?.params && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground ml-1">
                    Params
                  </span>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-x-auto text-[10px] font-mono leading-relaxed">
                    <pre>{formatJson(log.metadata.params)}</pre>
                  </div>
                </div>
              )}

              {log.metadata?.query && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground ml-1">
                    Query
                  </span>
                  <div className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-x-auto text-[10px] font-mono leading-relaxed">
                    <pre>{formatJson(log.metadata.query)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
