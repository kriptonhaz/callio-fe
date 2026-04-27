import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Send,
  Loader2,
  Paperclip,
  Smile,
  X,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  MessageSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { toast } from 'sonner'
import {
  useWhatsAppInstances,
  useSendMessage,
  useUploadMedia,
} from '@/hooks/api/useWhatsapp'

interface SendWhatsAppSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadPhone: string
  leadName: string
  // When provided, the send is attributed to the campaign as a blast-style
  // record. Used from Work Mode; the standalone WhatsApp instance details
  // page leaves these undefined so it stays a regular 1:1 chat.
  campaignId?: string
  isBlast?: boolean
}

type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document'

function getMessageTypeFromMime(mimeType: string): MessageType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export function SendWhatsAppSheet({
  open,
  onOpenChange,
  leadPhone,
  leadName,
  campaignId,
  isBlast,
}: SendWhatsAppSheetProps) {
  const { t } = useTranslation()

  const [instanceId, setInstanceId] = useState('')
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [contentError, setContentError] = useState('')
  const [instanceError, setInstanceError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: allInstances = [] } = useWhatsAppInstances()
  const sendMutation = useSendMessage()
  const uploadMutation = useUploadMedia()

  const connectedBaileysInstances = useMemo(
    () =>
      allInstances.filter(
        (i) => i.providerType === 'baileys' && i.status === 'connected',
      ),
    [allInstances],
  )

  // Auto-select instance when there is exactly one connected Baileys instance
  useEffect(() => {
    if (connectedBaileysInstances.length === 1) {
      setInstanceId(connectedBaileysInstances[0].id)
    }
  }, [connectedBaileysInstances])

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (!open) {
      setContent('')
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsUploading(false)
      setContentError('')
      setInstanceError('')
      if (connectedBaileysInstances.length !== 1) {
        setInstanceId('')
      }
    }
  }, [open, connectedBaileysInstances.length])

  // Object URL lifecycle for file preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
    // Reset input value so same file can be re-selected after removal
    e.target.value = ''
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getFileIcon = () => {
    if (!selectedFile) return <Paperclip className="h-4 w-4" />
    if (selectedFile.type.startsWith('image/'))
      return <ImageIcon className="h-4 w-4" />
    if (selectedFile.type.startsWith('video/'))
      return <VideoIcon className="h-4 w-4" />
    return <FileTextIcon className="h-4 w-4" />
  }

  const validate = (): boolean => {
    let valid = true

    if (!instanceId) {
      setInstanceError(
        t('whatsapp.instanceRequired', 'WhatsApp instance is required'),
      )
      valid = false
    } else {
      setInstanceError('')
    }

    if (!content.trim() && !selectedFile) {
      setContentError(
        t(
          'campaigns.messageOrFileRequired',
          'Please enter a message or attach a file',
        ),
      )
      valid = false
    } else {
      setContentError('')
    }

    return valid
  }

  const handleSend = async () => {
    if (!validate()) return

    const to = `${leadPhone}@s.whatsapp.net`
    let messageType: MessageType = 'text'
    let mediaUrl: string | undefined

    try {
      if (selectedFile) {
        setIsUploading(true)
        const uploadResult = await uploadMutation.mutateAsync({
          instanceId,
          file: selectedFile,
        })
        mediaUrl = uploadResult.mediaUrl
        messageType = getMessageTypeFromMime(selectedFile.type)
        setIsUploading(false)
      }

      await sendMutation.mutateAsync({
        instanceId,
        to,
        content,
        messageType,
        mediaUrl,
        // Forward blast attribution from the parent (Work Mode passes both;
        // the WhatsApp instance details page leaves these undefined).
        ...(isBlast !== undefined ? { isBlast } : {}),
        ...(campaignId ? { campaignId } : {}),
      })

      toast.success(
        t('campaigns.waSendSuccess', 'WhatsApp message sent successfully'),
      )
      onOpenChange(false)
    } catch {
      setIsUploading(false)
      toast.error(
        t('campaigns.waSendError', 'Failed to send WhatsApp message'),
      )
    }
  }

  const isBusy = sendMutation.isPending || isUploading

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-emerald-600">
            <MessageSquare className="h-5 w-5" />
            {t('campaigns.sendWhatsApp', 'Send WhatsApp')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'campaigns.sendWhatsAppDesc',
              'Send a WhatsApp message directly to this lead.',
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Instance selector — shown only when multiple connected instances exist */}
            {connectedBaileysInstances.length !== 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('whatsapp.instance', 'WhatsApp Instance')}
                </label>
                <Select value={instanceId} onValueChange={setInstanceId}>
                  <SelectTrigger
                    className={instanceError ? 'border-destructive' : ''}
                  >
                    <SelectValue
                      placeholder={
                        connectedBaileysInstances.length === 0
                          ? t(
                              'whatsapp.noConnectedInstances',
                              'No connected instances',
                            )
                          : t(
                              'whatsapp.selectInstance',
                              'Select WhatsApp instance',
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedBaileysInstances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.name} ({instance.phoneNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {instanceError && (
                  <p className="text-xs text-destructive">{instanceError}</p>
                )}
              </div>
            )}

            {/* Locked recipient */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.waRecipient', 'Recipient')}
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border bg-muted/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {leadName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {leadPhone}
                  </span>
                </div>
                <span className="ml-auto shrink-0 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {t('campaigns.waJidFormat', 'WA JID')}
                </span>
              </div>
            </div>

            {/* File attachment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('common.attachment', 'Attachment')}
              </label>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />
              {!selectedFile ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {t('common.attachFile', 'Attach File')}
                </Button>
              ) : (
                <div className="flex items-center justify-between w-full p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {selectedFile.type.startsWith('image/') && previewUrl ? (
                      <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-white">
                        <img
                          src={previewUrl}
                          alt={t('common.preview', 'preview')}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : selectedFile.type.startsWith('video/') && previewUrl ? (
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
                      <span className="text-sm font-medium truncate max-w-[220px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Compose area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t('common.message', 'Message')}
                </label>
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
                        setContent((prev) => prev + emojiData.emoji)
                      }}
                      width={320}
                      height={400}
                      previewConfig={{ showPreview: false }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                placeholder={t(
                  'campaigns.waMessagePlaceholder',
                  'Type your message here...',
                )}
                className={`min-h-[150px] resize-none${contentError ? ' border-destructive' : ''}`}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (e.target.value.trim() || selectedFile) {
                    setContentError('')
                  }
                }}
              />
              {contentError && (
                <p className="text-xs text-destructive">{contentError}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20">
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isBusy || connectedBaileysInstances.length === 0}
              onClick={handleSend}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isUploading
                ? t('common.uploading', 'Uploading...')
                : sendMutation.isPending
                  ? t('common.sending', 'Sending...')
                  : t('campaigns.sendMessage', 'Send Message')}
            </Button>

            {connectedBaileysInstances.length === 0 && (
              <p className="text-xs text-destructive text-center mt-2">
                {t(
                  'whatsapp.noConnectedInstancesWarning',
                  'No connected WhatsApp instances available. Please connect an instance first.',
                )}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
