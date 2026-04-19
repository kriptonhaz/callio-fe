import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Mail, PenSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type {ComposeInitialValues} from '@/components/email/ComposeDialog';
import { RoleGuard } from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { emailKeys, useEmailAccounts } from '@/hooks/api/useEmail'
import { AccountsPanel } from '@/components/email/AccountsPanel'
import { FolderTree } from '@/components/email/FolderTree'
import { MessageList } from '@/components/email/MessageList'
import { MessageView } from '@/components/email/MessageView'
import { AddAccountDialog } from '@/components/email/AddAccountDialog'
import {
  ComposeDialog
  
} from '@/components/email/ComposeDialog'

interface EmailSearch {
  accountId?: string
  folder?: string
  uid?: number
}

export const Route = createFileRoute('/dashboard/email/')({
  component: EmailPage,
  validateSearch: (search: Record<string, unknown>): EmailSearch => ({
    accountId:
      typeof search.accountId === 'string' ? search.accountId : undefined,
    folder: typeof search.folder === 'string' ? search.folder : undefined,
    uid:
      typeof search.uid === 'string' || typeof search.uid === 'number'
        ? Number(search.uid)
        : undefined,
  }),
})

function EmailPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <EmailContent />
    </RoleGuard>
  )
}

function EmailContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const searchParams = Route.useSearch()
  const { data: accounts } = useEmailAccounts()

  const [addOpen, setAddOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeInitial, setComposeInitial] = useState<
    ComposeInitialValues | undefined
  >(undefined)

  // Handle Google OAuth return. The backend appends ?emailLinkStatus=linked
  // or ?emailLinkStatus=error to the returnTo URL. Show a toast, strip the
  // params so they don't linger, and refetch accounts on success.
  const oauthHandledRef = useRef(false)
  useEffect(() => {
    if (oauthHandledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const status = params.get('emailLinkStatus')
    if (!status) return
    oauthHandledRef.current = true
    if (status === 'linked') {
      const email = params.get('linkedEmail') ?? ''
      toast.success(email ? `Linked ${email}` : 'Email account linked')
      queryClient.invalidateQueries({ queryKey: emailKeys.accounts() })
    } else if (status === 'error') {
      toast.error(
        params.get('error') || 'Failed to link Google account',
      )
    }
    // Strip the query params so a refresh doesn't re-trigger the toast.
    window.history.replaceState(
      {},
      '',
      window.location.pathname + window.location.hash,
    )
  }, [queryClient])

  const accountId = searchParams.accountId ?? null
  const folder = searchParams.folder ?? null
  const uid = searchParams.uid ?? null

  // Auto-select first account / INBOX when none selected.
  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) {
      navigate({
        to: '/dashboard/email',
        search: { accountId: accounts[0].id, folder: 'INBOX' },
        replace: true,
      })
    }
  }, [accountId, accounts, navigate])

  const updateSearch = (next: Partial<EmailSearch>) => {
    navigate({
      to: '/dashboard/email',
      search: { ...searchParams, ...next },
      replace: false,
    })
  }

  const handleSelectAccount = (id: string) => {
    updateSearch({ accountId: id, folder: 'INBOX', uid: undefined })
  }

  const handleSelectFolder = (path: string) => {
    updateSearch({ folder: path, uid: undefined })
  }

  const handleSelectMessage = (selectedUid: number) => {
    updateSearch({ uid: selectedUid })
  }

  const hasAccounts = (accounts?.length ?? 0) > 0

  const selectedAccountEmail = useMemo(
    () => accounts?.find((a) => a.id === accountId)?.email,
    [accounts, accountId],
  )

  const handleCompose = () => {
    setComposeInitial(undefined)
    setComposeOpen(true)
  }

  const handleReply = (init: ComposeInitialValues) => {
    setComposeInitial(init)
    setComposeOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-[calc(100vh-6rem)] min-h-[600px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h1 className="text-xl font-bold">
            {t('email.title', 'Email')}
          </h1>
        </div>
        {hasAccounts && (
          <Button onClick={handleCompose} className="gap-2">
            <PenSquare className="h-4 w-4" />
            {t('email.compose', 'Compose')}
          </Button>
        )}
      </div>

      {!hasAccounts ? (
        <EmptyState onAddClick={() => setAddOpen(true)} />
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[14rem_24rem_1fr] gap-3 rounded-lg border overflow-hidden">
          {/* Left: Accounts + Folders */}
          <div className="flex flex-col gap-4 p-3 border-r overflow-y-auto bg-muted/20">
            <AccountsPanel
              selectedAccountId={accountId}
              onSelect={handleSelectAccount}
              onAddClick={() => setAddOpen(true)}
            />
            <FolderTree
              accountId={accountId}
              selectedFolder={folder}
              onSelect={handleSelectFolder}
            />
          </div>

          {/* Middle: Message list */}
          <div className="flex flex-col min-h-0 border-r">
            <MessageList
              accountId={accountId}
              folder={folder}
              selectedUid={uid}
              onSelect={handleSelectMessage}
            />
          </div>

          {/* Right: Message view */}
          <div className="flex flex-col min-h-0">
            <MessageView
              accountId={accountId}
              folder={folder}
              uid={uid}
              onReply={handleReply}
            />
          </div>
        </div>
      )}

      <AddAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(id) => handleSelectAccount(id)}
        returnTo={`${window.location.origin}/dashboard/email`}
      />

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        accountId={accountId}
        accountEmail={selectedAccountEmail}
        initial={composeInitial}
      />
    </div>
  )
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-md text-center flex flex-col items-center gap-4 p-8 rounded-lg border border-dashed">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No email account connected</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Link your Gmail, Outlook, or any IMAP mailbox to read and triage
            emails inside Callio.
          </p>
        </div>
        <Button onClick={onAddClick}>Add email account</Button>
      </div>
    </div>
  )
}
