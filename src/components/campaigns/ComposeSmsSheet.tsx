import { useState, useMemo, useEffect } from 'react'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  CalendarIcon,
  Send,
  Loader2,
  Info,
  Users,
  ChevronDown,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useComposeSms } from '@/hooks/api/useSms'
import { useCampaign } from '@/hooks/api/useCampaigns'
import { useAiModels } from '@/hooks/api/useAiModels'
import { useGenerateSms } from '@/hooks/api/useAiSms'
import { ServiceType } from '@/lib/api/types/services.types'
import { toast } from 'sonner'

export interface MaskingOption {
  id: string
  name: string
}

export interface LeadOption {
  id: string
  name: string
  phone: string
}

interface ComposeSmsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  maskingOptions: MaskingOption[]
  defaultMaskingId?: string
  allLeadAssignments: LeadOption[]
}

// Regex to match emoji characters
const emojiRegex =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u

// Template variables for SMS personalization
const templateVariables = [
  { key: '{leadName}', description: 'Full lead name' },
  { key: '{firstName}', description: 'First part of lead name' },
  { key: '{phone}', description: 'Phone number' },
  { key: '{email}', description: 'Email address' },
  { key: '{city}', description: 'City' },
  { key: '{province}', description: 'Province' },
  { key: '{companyName}', description: 'Company name' },
  { key: '{jobTitle}', description: 'Job title' },
  { key: '{occupation}', description: 'Occupation' },
  { key: '{address}', description: 'Address' },
]

const formSchema = z.object({
  maskingId: z.string().min(1, 'Masking is required'),
  selectedLeadIds: z.array(z.string()),
  smsText: z
    .string()
    .min(1, 'SMS text is required')
    .max(1000, 'SMS text is too long')
    .refine((val) => !val.includes('|'), {
      message: 'Pipe character (|) is not allowed in SMS text',
    })
    .refine((val) => !emojiRegex.test(val), {
      message: 'Emoji characters are not allowed in SMS text',
    }),
  scheduleType: z.enum(['now', 'scheduled']),
  scheduledDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

const SMS_CHAR_LIMIT = 160

export function ComposeSmsSheet({
  open,
  onOpenChange,
  campaignId,
  maskingOptions,
  defaultMaskingId = '',
  allLeadAssignments,
}: ComposeSmsSheetProps) {
  const { t } = useTranslation()
  const [smsText, setSmsText] = useState('')
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [isLeadPopoverOpen, setIsLeadPopoverOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedAiModelId, setSelectedAiModelId] = useState('')
  const composeMutation = useComposeSms()
  const generateSmsMutation = useGenerateSms()

  // Fetch campaign details to check for AI service
  const { data: campaign } = useCampaign(campaignId)
  const hasAiService = useMemo(() => {
    if (!campaign) return false
    // Check both serviceTypes array and campaignServices relation
    const services = campaign.serviceTypes || []
    const campaignServices =
      campaign.campaignServices?.map((s) => s.serviceType) || []
    return (
      services.includes(ServiceType.AI) ||
      campaignServices.includes(ServiceType.AI)
    )
  }, [campaign])

  // Fetch AI models with chat capability
  const { data: aiModelsData, isLoading: isLoadingAiModels } = useAiModels(
    { capability: 'chat', limit: 50 },
    isAiModalOpen,
  )
  const aiModels = aiModelsData?.data ?? []

  // Determine if masking should be readonly (only 1 option)
  const isMaskingReadonly = maskingOptions.length === 1

  // Get default masking ID
  const getDefaultMaskingId = (): string => {
    if (defaultMaskingId) return defaultMaskingId
    if (maskingOptions.length === 1) return maskingOptions[0].id
    return ''
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      maskingId: getDefaultMaskingId(),
      selectedLeadIds: allLeadAssignments.map((l) => l.id), // Default to all selected
      smsText: '',
      scheduleType: 'now',
      scheduledDate: undefined,
    },
  })

  const scheduleType = form.watch('scheduleType')
  const selectedLeadIds = form.watch('selectedLeadIds')

  // Update selected leads when allLeadAssignments loads (default to all)
  useEffect(() => {
    if (
      allLeadAssignments.length > 0 &&
      form.getValues('selectedLeadIds').length === 0
    ) {
      form.setValue(
        'selectedLeadIds',
        allLeadAssignments.map((l) => l.id),
      )
    }
  }, [allLeadAssignments, form])

  // Update masking ID when defaultMaskingId or maskingOptions change
  useEffect(() => {
    const currentMaskingId = form.getValues('maskingId')
    const newDefaultMaskingId = getDefaultMaskingId()

    // Only update if there's a new default and current is empty or invalid
    if (
      newDefaultMaskingId &&
      (!currentMaskingId ||
        !maskingOptions.find((m) => m.id === currentMaskingId))
    ) {
      form.setValue('maskingId', newDefaultMaskingId)
    }
  }, [defaultMaskingId, maskingOptions, form])

  // Calculate character count and SMS count
  const charCount = smsText.length
  const smsCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1

  // Calculate recipient count
  const recipientCount = selectedLeadIds.length
  const isAllSelected = selectedLeadIds.length === allLeadAssignments.length

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery) return allLeadAssignments
    const query = leadSearchQuery.toLowerCase()
    return allLeadAssignments.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) || lead.phone.includes(query),
    )
  }, [allLeadAssignments, leadSearchQuery])

  const handleSmsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setSmsText(text)
    form.setValue('smsText', text)
  }

  const insertTemplateVariable = (variable: string) => {
    const textarea = document.querySelector(
      'textarea[name="smsText"]',
    ) as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = smsText.slice(0, start) + variable + smsText.slice(end)
      setSmsText(newText)
      form.setValue('smsText', newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length,
        )
      }, 0)
    } else {
      const newText = smsText + variable
      setSmsText(newText)
      form.setValue('smsText', newText)
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    const current = form.getValues('selectedLeadIds')
    if (current.includes(leadId)) {
      form.setValue(
        'selectedLeadIds',
        current.filter((id) => id !== leadId),
      )
    } else {
      form.setValue('selectedLeadIds', [...current, leadId])
    }
  }

  const selectAllLeads = () => {
    form.setValue(
      'selectedLeadIds',
      allLeadAssignments.map((l) => l.id),
    )
  }

  const deselectAllLeads = () => {
    form.setValue('selectedLeadIds', [])
  }

  const removeLeadFromSelection = (leadId: string) => {
    const current = form.getValues('selectedLeadIds')
    form.setValue(
      'selectedLeadIds',
      current.filter((id) => id !== leadId),
    )
  }

  const onSubmit = async (data: FormValues) => {
    if (data.selectedLeadIds.length === 0) {
      toast.error(
        t('campaigns.noLeadsSelected', 'Please select at least one lead'),
      )
      return
    }

    try {
      await composeMutation.mutateAsync({
        campaignId,
        data: {
          message: data.smsText,
          maskingId: data.maskingId,
          timing: data.scheduleType,
          scheduledAt:
            data.scheduleType === 'scheduled' && data.scheduledDate
              ? data.scheduledDate.toISOString()
              : undefined,
          leadAssignmentIds: data.selectedLeadIds,
        },
      })

      toast.success(
        data.scheduleType === 'now'
          ? t('campaigns.smsSentSuccess', 'SMS sent successfully')
          : t('campaigns.smsScheduledSuccess', 'SMS scheduled successfully'),
      )

      // Reset form
      form.reset()
      setSmsText('')
      onOpenChange(false)
    } catch {
      toast.error(t('campaigns.smsError', 'Failed to send SMS'))
    }
  }

  // Get lead name by ID for displaying badges
  const getLeadById = (id: string) =>
    allLeadAssignments.find((l) => l.id === id)

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
                name="maskingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('campaigns.masking', 'Masking')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destination / Lead Selection Field */}
              <FormField
                control={form.control}
                name="selectedLeadIds"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {t('campaigns.destination', 'Destination')}
                    </FormLabel>
                    <Popover
                      open={isLeadPopoverOpen}
                      onOpenChange={setIsLeadPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between h-auto min-h-10',
                              !selectedLeadIds.length &&
                                'text-muted-foreground',
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 text-left">
                              <Users className="h-4 w-4 shrink-0" />
                              {isAllSelected ? (
                                <span>
                                  {t('campaigns.allLeads', 'All Leads')} (
                                  {allLeadAssignments.length})
                                </span>
                              ) : selectedLeadIds.length > 0 ? (
                                <span>
                                  {selectedLeadIds.length}{' '}
                                  {t('common.selected', 'selected')}
                                </span>
                              ) : (
                                <span>
                                  {t('campaigns.selectLeads', 'Select leads')}
                                </span>
                              )}
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder={t(
                              'campaigns.searchLeads',
                              'Search leads...',
                            )}
                            value={leadSearchQuery}
                            onValueChange={setLeadSearchQuery}
                          />
                          <div className="flex items-center justify-between p-2 border-b">
                            <span className="text-xs text-muted-foreground">
                              {selectedLeadIds.length} /{' '}
                              {allLeadAssignments.length}{' '}
                              {t('common.selected', 'selected')}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={selectAllLeads}
                              >
                                {t('common.selectAll', 'Select All')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={deselectAllLeads}
                              >
                                {t('common.unselectAll', 'Unselect All')}
                              </Button>
                            </div>
                          </div>
                          <CommandList>
                            <CommandEmpty>
                              {t('campaigns.noLeadsFound', 'No leads found.')}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredLeads.map((lead) => {
                                const isSelected = selectedLeadIds.includes(
                                  lead.id,
                                )
                                return (
                                  <CommandItem
                                    key={lead.id}
                                    value={lead.id}
                                    onSelect={() =>
                                      toggleLeadSelection(lead.id)
                                    }
                                  >
                                    <div
                                      className={cn(
                                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                        isSelected
                                          ? 'bg-primary text-primary-foreground'
                                          : 'opacity-50 [&_svg]:invisible',
                                      )}
                                    >
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="font-medium">
                                        {lead.name}
                                      </span>
                                      <span className="ml-2 text-muted-foreground text-sm">
                                        {lead.phone}
                                      </span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {/* Show selected badges when not all are selected */}
                    {!isAllSelected &&
                      selectedLeadIds.length > 0 &&
                      selectedLeadIds.length <= 5 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedLeadIds.map((id) => {
                            const lead = getLeadById(id)
                            if (!lead) return null
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {lead.name}
                                <button
                                  type="button"
                                  onClick={() => removeLeadFromSelection(id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })}
                        </div>
                      )}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        {t('campaigns.smsText', 'SMS Text')}
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        {hasAiService && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => setIsAiModalOpen(true)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {t('campaigns.generateAi', 'Generate with AI')}
                          </Button>
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              {t('campaigns.templateVariables', 'Variables')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="end">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">
                                {t(
                                  'campaigns.templateVariablesTitle',
                                  'Personalization Variables',
                                )}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {t(
                                  'campaigns.templateVariablesDescription',
                                  'Click a variable to insert it into your message. Values will be replaced with lead data.',
                                )}
                              </p>

                              <ScrollArea className="h-[280px] w-full pr-3">
                                <div className="flex flex-col gap-1">
                                  {templateVariables.map((variable) => (
                                    <button
                                      key={variable.key}
                                      type="button"
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-left text-sm w-full"
                                      onClick={() =>
                                        insertTemplateVariable(variable.key)
                                      }
                                    >
                                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                        {variable.key}
                                      </code>
                                      <span className="text-muted-foreground text-xs">
                                        {variable.description}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                                format(field.value, 'PPP p')
                              ) : (
                                <span>
                                  {t(
                                    'campaigns.pickDateTime',
                                    'Pick a date & time',
                                  )}
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
                            onSelect={(date) => {
                              if (date) {
                                // Preserve existing time if set, otherwise use current time
                                const existingDate = field.value
                                if (existingDate) {
                                  date.setHours(existingDate.getHours())
                                  date.setMinutes(existingDate.getMinutes())
                                } else {
                                  const now = new Date()
                                  date.setHours(now.getHours())
                                  date.setMinutes(now.getMinutes() + 5)
                                }
                              }
                              field.onChange(date)
                            }}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return date < today
                            }}
                            initialFocus
                          />
                          <div className="border-t p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {t('campaigns.time', 'Time')}:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={23}
                                  value={field.value?.getHours() ?? 12}
                                  onChange={(e) => {
                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date()
                                    newDate.setHours(
                                      parseInt(e.target.value) || 0,
                                    )
                                    field.onChange(newDate)
                                  }}
                                  className="w-14 h-8 text-center border rounded-md text-sm"
                                  placeholder="HH"
                                />
                                <span className="text-lg font-bold">:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={59}
                                  value={
                                    field.value
                                      ?.getMinutes()
                                      .toString()
                                      .padStart(2, '0') ?? '00'
                                  }
                                  onChange={(e) => {
                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date()
                                    newDate.setMinutes(
                                      parseInt(e.target.value) || 0,
                                    )
                                    field.onChange(newDate)
                                  }}
                                  className="w-14 h-8 text-center border rounded-md text-sm"
                                  placeholder="MM"
                                />
                              </div>
                            </div>
                          </div>
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
                disabled={composeMutation.isPending}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={composeMutation.isPending || recipientCount === 0}
              >
                {composeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {scheduleType === 'now'
                  ? t('campaigns.sendNow', 'Send Now')
                  : t('campaigns.schedule', 'Schedule')}
                {recipientCount > 0 && (
                  <span className="ml-1">({recipientCount})</span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('campaigns.generateStatSms', 'Generate SMS with AI')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'campaigns.aiPromptDescription',
                'Describe what you want to say, and we will generate the SMS for you.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* AI Model Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.aiModel', 'AI Model')}
              </label>
              <Select
                value={selectedAiModelId}
                onValueChange={setSelectedAiModelId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingAiModels
                        ? t('common.loading', 'Loading...')
                        : t('campaigns.selectAiModel', 'Select AI model')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.prompt', 'Prompt')}
              </label>
              <Textarea
                placeholder={t(
                  'campaigns.aiPromptPlaceholder',
                  'e.g., specific promo for new leads...',
                )}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiModalOpen(false)}
              disabled={generateSmsMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                generateSmsMutation.mutate(
                  {
                    prompt: aiPrompt,
                    modelId: selectedAiModelId,
                    maxLength: 160,
                  },
                  {
                    onSuccess: (data) => {
                      // Update SMS text first, before closing the modal
                      setSmsText(data.content)
                      form.setValue('smsText', data.content)
                      // Clear modal state
                      setAiPrompt('')
                      setSelectedAiModelId('')
                      // Close modal last to avoid DOM issues
                      setIsAiModalOpen(false)
                      toast.success(
                        t(
                          'campaigns.smsGenerated',
                          'SMS generated successfully',
                        ),
                      )
                    },
                    onError: () => {
                      toast.error(
                        t(
                          'campaigns.smsGenerateFailed',
                          'Failed to generate SMS',
                        ),
                      )
                    },
                  },
                )
              }}
              disabled={
                !aiPrompt || !selectedAiModelId || generateSmsMutation.isPending
              }
            >
              {generateSmsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.generating', 'Generating...')}
                </>
              ) : (
                t('common.generate', 'Generate')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
