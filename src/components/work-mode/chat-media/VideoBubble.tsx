import { mediaSrc } from '@/lib/whatsapp/phone-to-jid'

interface Props {
  mediaUrl: string | null
  mimeType?: string | null
}

export function VideoBubble({ mediaUrl, mimeType }: Props) {
  if (!mediaUrl) return null
  return (
    <video
      controls
      preload="metadata"
      className="max-w-[260px] max-h-[300px] rounded-md bg-black"
      src={mediaSrc(mediaUrl)}
    >
      <source src={mediaSrc(mediaUrl)} type={mimeType ?? undefined} />
      Your browser does not support the video tag.
    </video>
  )
}
