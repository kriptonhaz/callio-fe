import { FileText } from 'lucide-react'
import { mediaSrc } from '@/lib/whatsapp/phone-to-jid'

interface Props {
  mediaUrl: string | null
  caption?: string | null
  isOutbound: boolean
}

export function DocumentBubble({ mediaUrl, caption, isOutbound }: Props) {
  if (!mediaUrl) return null
  const url = mediaSrc(mediaUrl)
  const filename = caption || url.split('/').pop() || 'Document'

  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank')}
      className={
        isOutbound
          ? 'flex items-center gap-3 p-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors w-full text-left'
          : 'flex items-center gap-3 p-2 rounded-md bg-black/5 hover:bg-black/10 transition-colors w-full text-left'
      }
    >
      <div className="h-9 w-9 bg-red-100 rounded flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-red-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{filename}</p>
        <p className="text-xs opacity-70">Click to open</p>
      </div>
    </button>
  )
}
