import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ComposeSmsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maskingOptions: string[]
  defaultMasking?: string
}

const formSchema = z.object({
  masking: z.string().min(1, 'Masking is required'),
  smsText: z
    .string()
    .min(1, 'SMS text is required')
    .max(1000, 'SMS text is too long'),
  scheduleType: z.enum(['now', 'scheduled']),
  scheduledDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

const SMS_CHAR_LIMIT = 160

export function ComposeSmsSheet({
  open,
  onOpenChange,
  maskingOptions,
  defaultMasking = '',
}: ComposeSmsSheetProps) {
  const { t } = useTranslation()
  const [smsText, setSmsText] = useState('')

  // Determine if masking should be readonly (only 1 option)
  const isMaskingReadonly = maskingOptions.length === 1

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      masking:
        defaultMasking ||
        (maskingOptions.length === 1 ? maskingOptions[0] : ''),
      smsText: '',
      scheduleType: 'now',
      scheduledDate: undefined,
    },
  })

  const scheduleType = form.watch('scheduleType')

  // Calculate character count and SMS count
  const charCount = smsText.length
  const smsCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1

  const handleSmsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setSmsText(text)
    form.setValue('smsText', text)
  }

  const onSubmit = async (data: FormValues) => {
    console.log('SMS Data:', data)
    // TODO: API integration
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {t('campaigns.composeSms', 'Compose SMS')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'campaigns.composeSmsDescription',
              'Create and send SMS messages to your campaign leads.',
            )}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Masking Field */}
              <FormField
                control={form.control}
                name="masking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('campaigns.masking', 'Masking')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isMaskingReadonly}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            isMaskingReadonly &&
                              'bg-muted cursor-not-allowed opacity-70',
                          )}
                        >
                          <SelectValue
                            placeholder={t(
                              'campaigns.selectMasking',
                              'Select masking',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maskingOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SMS Text Field */}
              <FormField
                control={form.control}
                name="smsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('campaigns.smsText', 'SMS Text')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          'campaigns.smsTextPlaceholder',
                          'Type your SMS message here...',
                        )}
                        className="min-h-[120px]"
                        {...field}
                        onChange={handleSmsTextChange}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>
                        {charCount} {t('campaigns.characters', 'characters')} •{' '}
                        {smsCount}{' '}
                        {smsCount === 1
                          ? t('campaigns.sms', 'SMS')
                          : t('campaigns.smses', 'SMSes')}
                      </span>
                      <span
                        className={cn(
                          charCount > 800 && 'text-destructive font-medium',
                        )}
                      >
                        {charCount > 800 &&
                          t('campaigns.textTooLong', 'Text is getting long')}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Schedule Type Field */}
              <FormField
                control={form.control}
                name="scheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('campaigns.sendTime', 'Send Time')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="now">
                          {t('campaigns.sendNow', 'Send Now')}
                        </SelectItem>
                        <SelectItem value="scheduled">
                          {t('campaigns.scheduled', 'Scheduled')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduled Date Picker - Show only when scheduled */}
              {scheduleType === 'scheduled' && (
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t('campaigns.scheduledDate', 'Scheduled Date & Time')}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>
                                  {t('campaigns.pickDate', 'Pick a date')}
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Action Buttons - Footer */}
            <div className="p-6 border-t bg-background mt-auto flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                {scheduleType === 'now'
                  ? t('campaigns.sendNow', 'Send Now')
                  : t('campaigns.schedule', 'Schedule')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
