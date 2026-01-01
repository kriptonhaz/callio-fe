import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

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
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import type { AiProvider } from '@/lib/api/types/ai-providers.types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  apiBaseUrl: z.string().url('Must be a valid URL'),
  apiKey: z
    .string()
    .optional()
    .refine(() => {
      // Required only for new or if provided for update
      return true // Logic handled in submit or refined if needed
    }),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface AiProviderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: AiProvider | null
  onSubmit: (values: any) => void
  isPending: boolean
}

export function AiProviderForm({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isPending,
}: AiProviderFormProps) {
  const { t } = useTranslation()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      apiBaseUrl: '',
      apiKey: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name,
        slug: provider.slug,
        apiBaseUrl: provider.apiBaseUrl,
        apiKey: '',
        isActive: provider.isActive,
      })
    } else {
      form.reset({
        name: '',
        slug: '',
        apiBaseUrl: '',
        apiKey: '',
        isActive: true,
      })
    }
  }, [provider, open, form])

  const handleFormSubmit = (values: FormValues) => {
    // If update and apiKey is empty, remove it from payload
    const payload = { ...values }
    if (provider && !payload.apiKey) {
      delete payload.apiKey
    }
    onSubmit(payload)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {provider
              ? t('aiProvider.editTitle', 'Edit AI Provider')
              : t('aiProvider.createTitle', 'Add AI Provider')}
          </SheetTitle>
          <SheetDescription>
            {provider
              ? t(
                  'aiProvider.editDescription',
                  'Update the AI provider configuration.',
                )
              : t(
                  'aiProvider.createDescription',
                  'Add a new AI provider to use for content generation.',
                )}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6 pt-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aiProvider.form.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="OpenAI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aiProvider.form.slug', 'Slug')}</FormLabel>
                  <FormControl>
                    <Input placeholder="openai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aiProvider.form.apiBaseUrl', 'API Base URL')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.openai.com/v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aiProvider.form.apiKey', 'API Key')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={provider ? '••••••••' : 'sk-...'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t('aiProvider.form.isActive', 'Active')}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {provider
                  ? t('common.save', 'Save')
                  : t('common.create', 'Create')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
