import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { mediaSrc } from '@/lib/whatsapp/phone-to-jid'

interface Props {
  mediaUrl: string | null
  caption?: string | null
}

export function ImageBubble({ mediaUrl, caption }: Props) {
  const [open, setOpen] = useState(false)
  if (!mediaUrl) return null
  const src = mediaSrc(mediaUrl)

  return (
    <>
      <div className="rounded-md overflow-hidden">
        <img
          src={src}
          alt={caption ?? 'Image'}
          className="max-w-[240px] max-h-[240px] w-auto h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setOpen(true)}
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          <img
            src={src}
            alt={caption ?? 'Image'}
            className="w-full h-auto max-h-[80vh] object-contain rounded"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
