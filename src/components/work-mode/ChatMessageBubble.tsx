import { format, isToday, isYesterday } from 'date-fns'
import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react'
import { ImageBubble } from './chat-media/ImageBubble'
import { VideoBubble } from './chat-media/VideoBubble'
import { AudioBubble } from './chat-media/AudioBubble'
import { DocumentBubble } from './chat-media/DocumentBubble'
import type { WhatsAppMessage } from '@/lib/api/types/whatsapp.types'
import { cn } from '@/lib/utils'

interface Props {
  message: WhatsAppMessage
}

export function ChatMessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div
      className={cn('flex w-full', isOutbound ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm',
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none',
        )}
      >
        <MediaContent message={message} isOutbound={isOutbound} />
        <TextContent message={message} />
        <MetaRow message={message} isOutbound={isOutbound} />
      </div>
    </div>
  )
}

function MediaContent({
  message,
  isOutbound,
}: {
  message: WhatsAppMessage
  isOutbound: boolean
}) {
  switch (message.messageType) {
    case 'image':
    case 'sticker':
      return (
        <div className={cn(message.content ? 'mb-2' : '')}>
          <ImageBubble
            mediaUrl={message.mediaUrl}
            caption={message.content}
          />
        </div>
      )
    case 'video':
      return (
        <div className={cn(message.content ? 'mb-2' : '')}>
          <VideoBubble
            mediaUrl={message.mediaUrl}
            mimeType={message.mediaMimeType}
          />
        </div>
      )
    case 'audio':
      return (
        <div className={cn(message.content ? 'mb-2' : '')}>
          <AudioBubble
            mediaUrl={message.mediaUrl}
            mimeType={message.mediaMimeType}
          />
        </div>
      )
    case 'document':
      return (
        <div className={cn(message.content ? 'mb-2' : '')}>
          <DocumentBubble
            mediaUrl={message.mediaUrl}
            caption={message.content}
            isOutbound={isOutbound}
          />
        </div>
      )
    default:
      return null
  }
}

function TextContent({ message }: { message: WhatsAppMessage }) {
  // For document messages the filename is rendered inside DocumentBubble;
  // avoid rendering the caption twice.
  if (message.messageType === 'document') return null
  // Skip common media placeholders WhatsApp sends for non-text messages.
  const placeholders = ['[Image]', '[Video]', '[Audio]', '[Document]']
  if (placeholders.includes(message.content)) return null
  if (!message.content) return null
  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed">
      {message.content}
    </p>
  )
}

function MetaRow({
  message,
  isOutbound,
}: {
  message: WhatsAppMessage
  isOutbound: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-1 mt-1 text-[10px] leading-none',
        isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground',
      )}
    >
      <span>{formatTime(message.createdAt)}</span>
      {isOutbound && <StatusIcon status={message.status} />}
      {isOutbound && message.status === 'failed' && message.errorMessage && (
        <span
          className="ml-1 text-destructive font-medium"
          title={message.errorMessage}
        >
          · failed
        </span>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: WhatsAppMessage['status'] }) {
  switch (status) {
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-400" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3" />
    case 'sent':
      return <Check className="h-3 w-3" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive" />
    default:
      return <Clock className="h-3 w-3 opacity-60" />
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
    return format(d, 'dd MMM HH:mm')
  } catch {
    return ''
  }
}
