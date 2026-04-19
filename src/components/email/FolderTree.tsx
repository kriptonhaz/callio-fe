import { useMemo } from 'react'
import {
  Archive,
  FileEdit,
  Folder,
  Inbox,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react'
import type { EmailFolder } from '@/lib/api/types/email.types'
import { useEmailFolders } from '@/hooks/api/useEmail'
import { cn } from '@/lib/utils'

interface Props {
  accountId: string | null
  selectedFolder: string | null
  onSelect: (path: string) => void
}

const SPECIAL_ORDER: Array<string> = [
  '\\Inbox',
  '\\Sent',
  '\\Drafts',
  '\\Archive',
  '\\Trash',
  '\\Junk',
]

function iconFor(folder: EmailFolder) {
  switch (folder.specialUse) {
    case '\\Sent':
      return <Send className="h-3.5 w-3.5" />
    case '\\Drafts':
      return <FileEdit className="h-3.5 w-3.5" />
    case '\\Trash':
      return <Trash2 className="h-3.5 w-3.5" />
    case '\\Archive':
      return <Archive className="h-3.5 w-3.5" />
    default:
      if (folder.path === 'INBOX' || folder.specialUse === '\\Inbox')
        return <Inbox className="h-3.5 w-3.5" />
      return <Folder className="h-3.5 w-3.5" />
  }
}

function sortFolders(folders: Array<EmailFolder>): Array<EmailFolder> {
  const score = (f: EmailFolder): number => {
    if (f.path === 'INBOX') return 0
    const idx = SPECIAL_ORDER.indexOf(f.specialUse ?? '')
    return idx >= 0 ? idx + 1 : 1000
  }
  return [...folders].sort((a, b) => {
    const diff = score(a) - score(b)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name)
  })
}

export function FolderTree({ accountId, selectedFolder, onSelect }: Props) {
  const { data: folders, isLoading } = useEmailFolders(accountId)
  const sorted = useMemo(() => sortFolders(folders ?? []), [folders])

  if (!accountId) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Folders
      </span>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">No folders.</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {sorted.map((f) => (
            <button
              key={f.path}
              type="button"
              onClick={() => onSelect(f.path)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-muted transition-colors',
                selectedFolder === f.path && 'bg-muted font-medium',
              )}
            >
              <span className="text-muted-foreground shrink-0">
                {iconFor(f)}
              </span>
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
