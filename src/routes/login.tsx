import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useLogin, useForgotPassword } from '@/hooks/api/useAuth'

import rangcoolLogo from '@/assets/images/rangcool-logo.png'

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutate: login, isPending, error } = useLogin()
  const {
    mutate: forgotPassword,
    isPending: isForgotPending,
    error: forgotError,
  } = useForgotPassword()
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('callio_access_token')
    if (token) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [navigate])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    login(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          navigate({ to: '/dashboard' })
        },
      },
    )
  }

  const onForgotPasswordSubmit = (data: ForgotPasswordFormValues) => {
    setForgotPasswordSuccess(false)
    forgotPassword(
      { email: data.email },
      {
        onSuccess: () => {
          setForgotPasswordSuccess(true)
        },
      },
    )
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setForgotPasswordSuccess(false)
    forgotForm.reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="flex flex-col items-center justify-center mb-4 gap-2">
            <img
              src={rangcoolLogo}
              alt="RangCool"
              className="h-16 w-auto object-contain"
            />
            <span className="font-bold text-2xl text-primary tracking-tight">
              RangCool
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {showForgotPassword
              ? t('login.forgotPasswordTitle', 'Reset Password')
              : t('login.title')}
          </CardTitle>
          <CardDescription>
            {showForgotPassword
              ? t(
                  'login.forgotPasswordSubtitle',
                  'Enter your email to receive a password reset link',
                )
              : t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            // Forgot Password Form
            <div className="space-y-4">
              {forgotPasswordSuccess ? (
                // Success State
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {t('login.emailSent', 'Check your email')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'login.emailSentDescription',
                        'We have sent a password reset link to your email address. Please check your inbox.',
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('login.backToLogin', 'Back to Login')}
                  </Button>
                </div>
              ) : (
                // Forgot Password Form
                <Form {...forgotForm}>
                  <form
                    onSubmit={forgotForm.handleSubmit(onForgotPasswordSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={forgotForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('login.email')}</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {forgotError && (
                      <div className="text-sm font-medium text-destructive text-center">
                        {forgotError.message ||
                          t('login.error.emailNotFound', 'Email not found')}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isForgotPending}
                    >
                      {isForgotPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('login.sending', 'Sending...')}
                        </>
                      ) : (
                        t('login.sendResetLink', 'Send Reset Link')
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={handleBackToLogin}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('login.backToLogin', 'Back to Login')}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          ) : (
            // Login Form
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.email')}</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
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

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal text-muted-foreground">
                            {t('login.rememberMe')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>

                {error && (
                  <div className="text-sm font-medium text-destructive text-center">
                    {error.message || t('login.error.invalid')}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('login.signingIn')}
                    </>
                  ) : (
                    t('login.signIn')
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
