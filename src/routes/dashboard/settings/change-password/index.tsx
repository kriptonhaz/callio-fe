import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {  useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type {Control} from 'react-hook-form';
import { RoleGuard } from '@/lib/auth-guard'
import { useChangePassword } from '@/hooks/api/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/settings/change-password/')({
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  return (
    <RoleGuard
      allowedRoles={['superadmin', 'admin', 'supervisor', 'agent']}
    >
      <ChangePasswordContent />
    </RoleGuard>
  )
}

function ChangePasswordContent() {
  const { t } = useTranslation()
  const { mutate: changePassword, isPending } = useChangePassword()

  const schema = z
    .object({
      currentPassword: z
        .string()
        .min(
          1,
          t(
            'changePassword.validation.currentRequired',
            'Current password is required',
          ),
        ),
      newPassword: z
        .string()
        .min(
          8,
          t(
            'changePassword.validation.newMin',
            'New password must be at least 8 characters',
          ),
        ),
      confirmPassword: z
        .string()
        .min(
          1,
          t(
            'changePassword.validation.confirmRequired',
            'Please confirm your new password',
          ),
        ),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      path: ['confirmPassword'],
      message: t(
        'changePassword.validation.mismatch',
        'New password and confirmation do not match',
      ),
    })
    .refine((d) => d.newPassword !== d.currentPassword, {
      path: ['newPassword'],
      message: t(
        'changePassword.validation.sameAsCurrent',
        'New password must differ from current password',
      ),
    })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success(
          t('changePassword.success', 'Password changed successfully'),
        )
        form.reset()
      },
      onError: (err) => {
        toast.error(
          err.message ||
            t('changePassword.error', 'Failed to change password'),
        )
      },
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>
                {t('changePassword.title', 'Change Password')}
              </CardTitle>
              <CardDescription>
                {t(
                  'changePassword.description',
                  'Update your account password',
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <PasswordField
                control={form.control}
                name="currentPassword"
                label={t(
                  'changePassword.currentPassword',
                  'Current Password',
                )}
              />
              <PasswordField
                control={form.control}
                name="newPassword"
                label={t('changePassword.newPassword', 'New Password')}
              />
              <PasswordField
                control={form.control}
                name="confirmPassword"
                label={t(
                  'changePassword.confirmPassword',
                  'Confirm New Password',
                )}
              />

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('changePassword.submitting', 'Changing...')}
                  </>
                ) : (
                  t('changePassword.submit', 'Change Password')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

interface PasswordFieldProps {
  control: Control<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }>
  name: 'currentPassword' | 'newPassword' | 'confirmPassword'
  label: string
}

function PasswordField({ control, name, label }: PasswordFieldProps) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete={
                  name === 'currentPassword'
                    ? 'current-password'
                    : 'new-password'
                }
                {...field}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShow((v) => !v)}
                aria-label={
                  show
                    ? t('changePassword.hidePassword', 'Hide password')
                    : t('changePassword.showPassword', 'Show password')
                }
              >
                {show ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
