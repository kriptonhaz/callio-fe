import { Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { EmailAttachment } from '@/lib/api/types/email.types'
import { Button } from '@/components/ui/button'
import { useDownloadEmailAttachment } from '@/hooks/api/useEmail'

interface Props {
  accountId: string
  uid: number
  folder: string
  attachment: EmailAttachment
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function AttachmentChip({ accountId, uid, folder, attachment }: Props) {
  const mut = useDownloadEmailAttachment()

  const handleDownload = async () => {
    try {
      const blob = await mut.mutateAsync({
        accountId,
        uid,
        partId: attachment.partId,
        folder,
      })
      triggerDownload(blob, attachment.filename)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to download')
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {attachment.contentType} · {formatSize(attachment.size)}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={mut.isPending}
        className="gap-1 shrink-0"
      >
        {mut.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Download
      </Button>
    </div>
  )
}
