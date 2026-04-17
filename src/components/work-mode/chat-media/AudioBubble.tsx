import { mediaSrc } from '@/lib/whatsapp/phone-to-jid'

interface Props {
  mediaUrl: string | null
  mimeType?: string | null
}

export function AudioBubble({ mediaUrl, mimeType }: Props) {
  if (!mediaUrl) return null
  return (
    <audio controls className="max-w-[260px]" src={mediaSrc(mediaUrl)}>
      <source src={mediaSrc(mediaUrl)} type={mimeType ?? undefined} />
      Your browser does not support the audio tag.
    </audio>
  )
}
