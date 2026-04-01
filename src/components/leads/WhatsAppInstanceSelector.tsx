import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Smartphone } from 'lucide-react'
import type { WhatsAppInstance } from '@/lib/api/types/whatsapp.types'

interface WhatsAppInstanceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instances: WhatsAppInstance[]
  onSelect: (instanceId: string) => void
  isLoading?: boolean
}

export function WhatsAppInstanceSelector({
  open,
  onOpenChange,
  instances,
  onSelect,
  isLoading,
}: WhatsAppInstanceSelectorProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('leads.selectInstance', 'Select WhatsApp Instance')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'leads.selectInstanceDesc',
              'Choose a connected WhatsApp instance to use for checking.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {instances.map((instance) => (
            <Button
              key={instance.id}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => onSelect(instance.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Smartphone className="h-4 w-4 shrink-0" />
              )}
              <div className="text-left">
                <div className="font-medium">{instance.name}</div>
                {instance.phoneNumber && (
                  <div className="text-xs text-muted-foreground">
                    {instance.phoneNumber}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
