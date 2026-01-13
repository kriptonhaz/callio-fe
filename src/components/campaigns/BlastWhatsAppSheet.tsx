import { useState, useMemo, useEffect, useRef } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Plus,
  Paperclip,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  Sparkles,
  Smile,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import {
  useWhatsAppInstances,
  useBlastWhatsApp,
  useUploadMedia,
} from '@/hooks/api/useWhatsapp'
import { useCampaign } from '@/hooks/api/useCampaigns'
import { useAiModels } from '@/hooks/api/useAiModels'
import { useGenerateSms } from '@/hooks/api/useAiSms'
import { ServiceType } from '@/lib/api/types/services.types'
import { toast } from 'sonner'
import type { LeadOption } from './ComposeSmsSheet'

interface BlastWhatsAppSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  allLeadAssignments: LeadOption[]
}

const templateVariables = [
  { key: '{leadName}', description: 'Full lead name' },
  { key: '{firstName}', description: 'First part of lead name' },
  { key: '{phone}', description: 'Phone number' },
]

const formSchema = z.object({
  instanceId: z.string().min(1, 'WhatsApp instance is required'),
  selectedLeadIds: z
    .array(z.string())
    .min(1, 'Please select at least one lead'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum([
    'text',
    'image',
    'video',
    'audio',
    'document',
    'sticker',
  ]),
  scheduleType: z.enum(['now', 'scheduled']),
  scheduledDate: z.date().optional(),
  mediaUrl: z.string().optional(),
  mediaMimeType: z.string().optional(),
  mediaName: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function BlastWhatsAppSheet({
  open,
  onOpenChange,
  campaignId,
  allLeadAssignments,
}: BlastWhatsAppSheetProps) {
  const { t } = useTranslation()
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [isLeadPopoverOpen, setIsLeadPopoverOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Generation State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedAiModelId, setSelectedAiModelId] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const blastMutation = useBlastWhatsApp()
  const uploadMutation = useUploadMedia()
  const generateSmsMutation = useGenerateSms()
  const { data: instances = [] } = useWhatsAppInstances()

  // Fetch campaign details to check for AI service
  const { data: campaign } = useCampaign(campaignId)
  const hasAiService = useMemo(() => {
    if (!campaign) return false
    const services = campaign.serviceTypes || []
    const campaignServices =
      campaign.campaignServices?.map((s) => s.serviceType) || []
    return (
      services.includes(ServiceType.AI) ||
      campaignServices.includes(ServiceType.AI)
    )
  }, [campaign])

  // Fetch AI models
  const { data: aiModelsData, isLoading: isLoadingAiModels } = useAiModels(
    { capability: 'chat', limit: 50 },
    isAiModalOpen,
  )
  const aiModels = aiModelsData?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      instanceId: '',
      selectedLeadIds: allLeadAssignments.map((l) => l.id),
      content: '',
      messageType: 'text',
      scheduleType: 'now',
      scheduledDate: undefined,
    },
  })

  const scheduleType = form.watch('scheduleType')
  const selectedLeadIds = form.watch('selectedLeadIds')

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

  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery) return allLeadAssignments
    const query = leadSearchQuery.toLowerCase()
    return allLeadAssignments.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) || lead.phone.includes(query),
    )
  }, [allLeadAssignments, leadSearchQuery])

  const isAllSelected = selectedLeadIds.length === allLeadAssignments.length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Determine message type based on file mime type
      if (file.type.startsWith('image/')) {
        form.setValue('messageType', 'image')
      } else if (file.type.startsWith('video/')) {
        form.setValue('messageType', 'video')
      } else if (file.type.startsWith('audio/')) {
        form.setValue('messageType', 'audio')
      } else {
        form.setValue('messageType', 'document')
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    form.setValue('messageType', 'text')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: FormValues) => {
    try {
      let mediaUrl = data.mediaUrl
      let mediaMimeType = data.mediaMimeType
      let mediaName = data.mediaName

      if (selectedFile) {
        setIsUploading(true)
        const uploadResult = await uploadMutation.mutateAsync({
          instanceId: data.instanceId,
          file: selectedFile,
        })
        mediaUrl = uploadResult.mediaUrl
        mediaMimeType = selectedFile.type
        mediaName = selectedFile.name
        setIsUploading(false)
      }

      const recipients = data.selectedLeadIds
        .map((id) => {
          const lead = allLeadAssignments.find((l) => l.id === id)
          return lead?.phone || ''
        })
        .filter((p) => !!p)

      await blastMutation.mutateAsync({
        instanceId: data.instanceId,
        campaignId,
        recipients,
        content: data.content,
        messageType: data.messageType,
        scheduledAt:
          data.scheduleType === 'scheduled'
            ? data.scheduledDate?.toISOString()
            : undefined,
        mediaUrl,
        mediaMimeType,
        mediaName,
      })

      toast.success(
        t('campaigns.whatsappBlastSuccess', 'WhatsApp blast sent successfully'),
      )
      onOpenChange(false)
      form.reset()
      setSelectedFile(null)
    } catch (error) {
      toast.error(
        t('campaigns.whatsappBlastError', 'Failed to send WhatsApp blast'),
      )
      setIsUploading(false)
    }
  }

  const insertTemplateVariable = (variable: string) => {
    const current = form.getValues('content')
    form.setValue('content', current + variable)
  }

  const getFileIcon = () => {
    if (!selectedFile) return <Paperclip className="h-4 w-4" />
    if (selectedFile.type.startsWith('image/'))
      return <ImageIcon className="h-4 w-4" />
    if (selectedFile.type.startsWith('video/'))
      return <VideoIcon className="h-4 w-4" />
    return <FileTextIcon className="h-4 w-4" />
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-emerald-600">
            <Send className="h-5 w-5" />
            {t('campaigns.whatsappBlast', 'Whatsapp Blast')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'campaigns.whatsappBlastDesc',
              'Send WhatsApp messages with attachments to campaign leads.',
            )}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Instance Selector */}
              <FormField
                control={form.control}
                name="instanceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('whatsapp.instance', 'WhatsApp Instance')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'whatsapp.selectInstance',
                              'Select WhatsApp instance',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instances.map((instance) => (
                          <SelectItem key={instance.id} value={instance.id}>
                            {instance.name} ({instance.phoneNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lead Selector */}
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
                            className={cn(
                              'w-full justify-between h-auto min-h-10',
                              !selectedLeadIds.length &&
                                'text-muted-foreground',
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 text-left">
                              <Users className="h-4 w-4" />
                              {isAllSelected ? (
                                <span>
                                  {t('campaigns.allLeads', 'All Leads')} (
                                  {allLeadAssignments.length})
                                </span>
                              ) : (
                                <span>
                                  {selectedLeadIds.length}{' '}
                                  {t('common.selected', 'selected')}
                                </span>
                              )}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50" />
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
                                onClick={() =>
                                  form.setValue(
                                    'selectedLeadIds',
                                    allLeadAssignments.map((l) => l.id),
                                  )
                                }
                              >
                                {t('common.selectAll', 'Select All')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  form.setValue('selectedLeadIds', [])
                                }
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
                                    onSelect={() => {
                                      const current =
                                        form.getValues('selectedLeadIds')
                                      form.setValue(
                                        'selectedLeadIds',
                                        isSelected
                                          ? current.filter(
                                              (id) => id !== lead.id,
                                            )
                                          : [...current, lead.id],
                                      )
                                    }}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachment */}
              <div className="space-y-2">
                <FormLabel>{t('common.attachment', 'Attachment')}</FormLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {!selectedFile ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('common.addFile', 'Add File')}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full p-2 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {selectedFile.type.startsWith('image/') &&
                        previewUrl ? (
                          <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-white">
                            <img
                              src={previewUrl}
                              alt="preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : selectedFile.type.startsWith('video/') &&
                          previewUrl ? (
                          <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-white relative">
                            <video
                              src={previewUrl}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <VideoIcon className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded border flex items-center justify-center shrink-0 bg-white">
                            {getFileIcon()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('common.message', 'Message')}</FormLabel>
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

                              <ScrollArea className="h-[200px] w-full pr-3">
                                <div className="flex flex-col gap-1">
                                  {templateVariables.map((variable) => (
                                    <button
                                      key={variable.key}
                                      type="button"
                                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-left text-sm w-full transition-colors"
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

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              <Smile className="h-3.5 w-3.5 mr-1" />
                              {t('common.emoji', 'Emoji')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="end"
                            className="w-full p-0 border-none shadow-none bg-transparent"
                          >
                            <EmojiPicker
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                const current = form.getValues('content')
                                form.setValue(
                                  'content',
                                  current + emojiData.emoji,
                                )
                              }}
                              width={320}
                              height={400}
                              previewConfig={{ showPreview: false }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          'campaigns.whatsappBlastPlaceholder',
                          'Type your message here...',
                        )}
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timing Selector */}
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
                  </FormItem>
                )}
              />

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
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="p-6 border-t bg-muted/20">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={blastMutation.isPending || isUploading}
              >
                {blastMutation.isPending || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t('campaigns.sendBlast', 'Send Blast')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                'campaigns.generateWhatsAppContent',
                'Generate WhatsApp Content with AI',
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'campaigns.aiPromptDescription',
                'Describe what you want to say, and we will generate the content for you.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
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
                    maxLength: 1000,
                  },
                  {
                    onSuccess: (data) => {
                      form.setValue('content', data.content)
                      setAiPrompt('')
                      setSelectedAiModelId('')
                      setIsAiModalOpen(false)
                      toast.success(
                        t(
                          'campaigns.contentGenerated',
                          'Content generated successfully',
                        ),
                      )
                    },
                    onError: () => {
                      toast.error(
                        t(
                          'campaigns.aiGenerationFailed',
                          'Failed to generate content',
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
