import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { HTTPError } from 'ky'
import { GoogleIcon } from './icons/GoogleIcon'
import type {
  EmailProviderKey,
  EmailProviderPreset,
} from '@/lib/email/providers'
import { EMAIL_PROVIDERS } from '@/lib/email/providers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  useCreateEmailAccount,
  useStartGoogleOAuth,
} from '@/hooks/api/useEmail'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  displayName: z.string().min(1, 'Give this account a name'),
  password: z.string().min(1, 'Password required'),
  imapHost: z.string().min(1, 'IMAP host required'),
  imapPort: z.number().int().min(1).max(65535),
  imapSecure: z.boolean(),
  smtpHost: z.string().min(1, 'SMTP host required'),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  username: z.string().min(1, 'Username required'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (accountId: string) => void
  /**
   * Absolute URL where Google should send the user back to after consent.
   * The page at this URL must read `?emailLinkStatus=…` from search params.
   */
  returnTo: string
}

export function AddAccountDialog({
  open,
  onOpenChange,
  onCreated,
  returnTo,
}: Props) {
  const createMut = useCreateEmailAccount()
  const googleMut = useStartGoogleOAuth()

  const [showImap, setShowImap] = useState(false)
  const [provider, setProvider] = useState<EmailProviderKey>('gmail')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const preset = useMemo(
    () =>
      EMAIL_PROVIDERS.find((p) => p.key === provider) as EmailProviderPreset,
    [provider],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      imapHost: preset.imapHost,
      imapPort: preset.imapPort,
      imapSecure: preset.imapSecure,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      smtpSecure: preset.smtpSecure,
      username: '',
    },
  })

  useEffect(() => {
    form.setValue('imapHost', preset.imapHost)
    form.setValue('imapPort', preset.imapPort)
    form.setValue('imapSecure', preset.imapSecure)
    form.setValue('smtpHost', preset.smtpHost)
    form.setValue('smtpPort', preset.smtpPort)
    form.setValue('smtpSecure', preset.smtpSecure)
  }, [provider])

  const emailValue = form.watch('email')
  useEffect(() => {
    const currentUsername = form.getValues('username')
    const prevEmail = form.getValues('email')
    if (!currentUsername || currentUsername === prevEmail) {
      form.setValue('username', emailValue)
    }
  }, [emailValue])

  useEffect(() => {
    if (!open) {
      form.reset()
      setProvider('gmail')
      setShowAdvanced(false)
      setShowImap(false)
    }
  }, [open])

  const handleGoogle = async () => {
    try {
      const { authUrl } = await googleMut.mutateAsync(returnTo)
      window.location.href = authUrl
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to start Google sign-in',
      )
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const created = await createMut.mutateAsync(values)
      toast.success('Email account connected')
      onCreated(created.id)
      onOpenChange(false)
    } catch (e) {
      const msg = await extractErrorMessage(e)
      const lower = msg.toLowerCase()
      if (lower.includes('already') || lower.includes('exist')) {
        form.setError('email', {
          message: 'This email is already linked to your account.',
        })
      } else if (
        lower.includes('auth') ||
        lower.includes('password') ||
        lower.includes('credentials') ||
        lower.includes('unauthor')
      ) {
        form.setError('password', {
          message:
            msg ||
            'Authentication failed. Generate a new app password and try again.',
        })
      } else {
        form.setError('root', { message: msg })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect your email</DialogTitle>
          <DialogDescription>
            Link a mailbox so you can read and triage mail inside Callio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Google primary */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-3 h-11 border-input"
            onClick={handleGoogle}
            disabled={googleMut.isPending}
          >
            {googleMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Sign in with Google
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Recommended — one-click, no app passwords.
          </p>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* IMAP fallback (collapsible) */}
          {!showImap ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowImap(true)}
              className="w-full"
            >
              Use IMAP + password
            </Button>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Provider</Label>
                <div className="grid grid-cols-3 gap-2">
                  {EMAIL_PROVIDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setProvider(p.key)}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-xs transition-colors',
                        provider === p.key
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {preset.helpText && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {preset.helpText}
                    {preset.helpUrl && (
                      <a
                        href={preset.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary underline"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    placeholder="My Email"
                    {...form.register('displayName')}
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">
                  {provider === 'gmail' || provider === 'outlook'
                    ? 'App password'
                    : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground w-fit"
                  >
                    {showAdvanced ? 'Hide advanced' : 'Advanced settings'}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" {...form.register('username')} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Incoming (IMAP)
                    </div>
                    <div className="grid grid-cols-[1fr_100px] gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="imap-host">Host</Label>
                        <Input id="imap-host" {...form.register('imapHost')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="imap-port">Port</Label>
                        <Input
                          id="imap-port"
                          type="number"
                          {...form.register('imapPort', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <Label
                        htmlFor="imap-secure"
                        className="text-sm cursor-pointer"
                      >
                        Use TLS (secure)
                      </Label>
                      <Switch
                        id="imap-secure"
                        checked={form.watch('imapSecure')}
                        onCheckedChange={(v) => form.setValue('imapSecure', v)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Outgoing (SMTP)
                    </div>
                    <div className="grid grid-cols-[1fr_100px] gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="smtp-host">Host</Label>
                        <Input id="smtp-host" {...form.register('smtpHost')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="smtp-port">Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          {...form.register('smtpPort', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <Label
                        htmlFor="smtp-secure"
                        className="text-sm cursor-pointer"
                      >
                        Use TLS (SSL/TLS on connect)
                      </Label>
                      <Switch
                        id="smtp-secure"
                        checked={form.watch('smtpSecure')}
                        onCheckedChange={(v) => form.setValue('smtpSecure', v)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      For ports like 587 (STARTTLS), turn this off — the server
                      upgrades the connection after handshake.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {form.formState.errors.root && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowImap(false)}
                  disabled={createMut.isPending}
                >
                  Back
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Connect
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function extractErrorMessage(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const json = (await err.response.clone().json()) as { message?: unknown }
      if (typeof json.message === 'string') return json.message
      if (Array.isArray(json.message)) return json.message.join(', ')
    } catch {
      // ignore
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Failed to connect account'
}
