import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  // Human-friendly name of the service ("Email", "WhatsApp", etc.) — used in
  // the message body. Defaults to a generic phrasing if not provided.
  serviceLabel?: string
  icon?: React.ReactNode
}

/**
 * Full-page state shown when the page's underlying service is not enabled
 * for the current client. Asks the user to contact support to activate it.
 */
export function ServiceInactiveCard({ serviceLabel, icon }: Props) {
  const { t } = useTranslation()
  const labelPart = serviceLabel
    ? t(
        'common.serviceInactiveBodyNamed',
        "You don't have {{service}} activated yet. Please contact our support to activate this service.",
        { service: serviceLabel },
      )
    : t(
        'common.serviceInactiveBody',
        "You don't have this service activated yet. Please contact our support to activate it.",
      )
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            {icon ?? (
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {t('common.serviceInactiveTitle', 'Service not yet active')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{labelPart}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
