import { useState } from 'react'
import { Loader2, Mail, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleIcon } from './icons/GoogleIcon'
import type { EmailAccount } from '@/lib/api/types/email.types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  useDeleteEmailAccount,
  useEmailAccounts,
} from '@/hooks/api/useEmail'

interface Props {
  selectedAccountId: string | null
  onSelect: (id: string) => void
  onAddClick: () => void
}

export function AccountsPanel({
  selectedAccountId,
  onSelect,
  onAddClick,
}: Props) {
  const { data: accounts, isLoading } = useEmailAccounts()
  const deleteMut = useDeleteEmailAccount()
  const [toDelete, setToDelete] = useState<EmailAccount | null>(null)

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMut.mutateAsync(toDelete.id)
      toast.success('Account removed')
      setToDelete(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Accounts
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddClick}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (accounts?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-3">
          No accounts yet.
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {accounts?.map((a) => (
            <div
              key={a.id}
              className={cn(
                'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors',
                selectedAccountId === a.id && 'bg-muted',
              )}
              onClick={() => onSelect(a.id)}
            >
              <div className="h-7 w-7 rounded-md border flex items-center justify-center shrink-0 bg-background">
                {a.provider === 'google' ? (
                  <GoogleIcon className="h-3.5 w-3.5" />
                ) : (
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{a.displayName}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {a.email}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setToDelete(a)
                }}
                aria-label="Delete account"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this email account?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.displayName} ({toDelete?.email}) will be disconnected
              from Callio. Your emails on the server are untouched — you can
              re-add the account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
