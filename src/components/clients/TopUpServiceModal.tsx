import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { ServiceType } from '@/lib/api/types/services.types'
import { Wallet, CreditCard, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useTopUpBalance } from '@/hooks/api/useBalance'
import { TopUpBalancePayload } from '@/lib/api/types/balance.types'
import { toast } from 'sonner'

interface TopUpServiceModalProps {
  clientId: string
  serviceType: ServiceType | null
  currentBalance?: number | string
  currency?: string
  unit?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(1, 'Amount must be at least 1')
    .max(10000000, 'Amount is too large'),
})

type FormValues = z.infer<typeof formSchema>

const PRESET_AMOUNTS_IDR = [10000, 25000, 50000, 100000]
const PRESET_AMOUNTS_TOKENS = [200, 500, 1000, 2000]

export function TopUpServiceModal({
  clientId,
  serviceType,
  currentBalance = 0,
  currency = 'IDR',
  unit = 'IDR',
  open,
  onOpenChange,
}: TopUpServiceModalProps) {
  const { t } = useTranslation()
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  const topUpMutation = useTopUpBalance()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: 0,
    },
  })

  // Reset form when modal opens
  if (!open && form.formState.isDirty) {
    form.reset()
    setSelectedPreset(null)
  }

  const handlePresetClick = (amount: number) => {
    form.setValue('amount', amount)
    setSelectedPreset(amount)
  }

  const onSubmit = async (data: FormValues) => {
    if (!serviceType) return

    const isTokenBased = unit === 'TOKENS'

    const payload: TopUpBalancePayload = isTokenBased
      ? { amountTokens: data.amount, description: 'Top-up tokens' }
      : { amountMoney: data.amount, description: 'Top-up balance' }

    topUpMutation.mutate(
      {
        clientId,
        serviceType,
        payload,
      },
      {
        onSuccess: () => {
          toast.success(t('common.success', 'Success'), {
            description: t(
              'services.topUpSuccess',
              'Balance topped up successfully',
            ),
          })
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(t('common.error', 'Error'), {
            description: t('services.topUpError', 'Failed to top up balance'),
          })
          console.error('Top up error:', error)
        },
      },
    )
  }

  const numericBalance = Number(currentBalance)
  const presetAmounts =
    unit === 'TOKENS' ? PRESET_AMOUNTS_TOKENS : PRESET_AMOUNTS_IDR

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('services.topUpTitle', 'Top Up Balance')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'services.topUpDescription',
              'Add funds to your {{service}} service balance.',
              { service: serviceType },
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center mb-4 border">
          <span className="text-sm font-medium text-muted-foreground">
            {t('services.currentBalance', 'Current Balance')}
          </span>
          <span className="text-lg font-bold">
            {unit === 'TOKENS'
              ? `${numericBalance.toLocaleString()} Tokens`
              : `${currency} ${numericBalance.toLocaleString()}`}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-auto py-3 px-4 justify-start flex flex-col items-start gap-1 relative overflow-hidden transition-all hover:bg-primary/5 hover:border-primary',
                      selectedPreset === amount &&
                        'border-primary bg-primary/5 ring-1 ring-primary',
                    )}
                    onClick={() => handlePresetClick(amount)}
                  >
                    <span className="font-semibold">
                      {unit === 'TOKENS'
                        ? `${amount.toLocaleString()} Tokens`
                        : `${currency} ${amount.toLocaleString()}`}
                    </span>
                    {selectedPreset === amount && (
                      <div className="absolute top-0 right-0 p-1.5 rounded-bl-lg bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('common.or', 'Or enter amount')}
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('services.customAmount', 'Custom Amount')}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="0"
                          type="number"
                          className="pl-9"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              setSelectedPreset(null)
                            }
                            field.onChange(e)
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={topUpMutation.isPending}
              >
                {topUpMutation.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('common.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('services.payNow', 'Pay Now')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
