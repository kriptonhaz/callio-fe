import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { RichTextEmailEditor } from './RichTextEmailEditor'
import { HtmlEmailPreview } from './HtmlEmailPreview'
import type { EmailTemplate } from '@/lib/api/types/email.types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from '@/hooks/api/useEmailTemplates'
import { renderPreview } from '@/lib/email/preview'
import { SAMPLE_PREVIEW_LEAD } from '@/lib/email/template-variables'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: EmailTemplate | null // null = create mode, EmailTemplate = edit mode
  onSaved?: (template: EmailTemplate) => void
}

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(998, 'Subject must be 998 characters or less'),
  description: z.string().optional(),
  html: z.string().min(1, 'Email body is required'),
})

type FormValues = z.infer<typeof schema>

export function EmailTemplateEditorSheet({
  open,
  onOpenChange,
  template,
  onSaved,
}: Props) {
  const { t } = useTranslation()
  const { mutate: createTemplate, isPending: isCreating } =
    useCreateEmailTemplate()
  const { mutate: updateTemplate, isPending: isUpdating } =
    useUpdateEmailTemplate()
  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      subject: '',
      description: '',
      html: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: template?.name ?? '',
        subject: template?.subject ?? '',
        description: template?.description ?? '',
        html: template?.html ?? '',
      })
    }
  }, [open, template, form])

  const handleSubmit = (data: FormValues) => {
    if (template) {
      updateTemplate(
        {
          id: template.id,
          data: {
            name: data.name,
            subject: data.subject,
            description: data.description || undefined,
            html: data.html,
          },
        },
        {
          onSuccess: (saved) => {
            toast.success(
              t('email.templates.updated', 'Template updated successfully'),
            )
            onSaved?.(saved)
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(
              err.message ||
                t(
                  'email.templates.updateFailed',
                  'Failed to update template',
                ),
            )
          },
        },
      )
    } else {
      createTemplate(
        {
          name: data.name,
          subject: data.subject,
          description: data.description || undefined,
          html: data.html,
        },
        {
          onSuccess: (saved) => {
            toast.success(
              t('email.templates.created', 'Template created successfully'),
            )
            onSaved?.(saved)
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(
              err.message ||
                t(
                  'email.templates.createFailed',
                  'Failed to create template',
                ),
            )
          },
        },
      )
    }
  }

  const watchHtml = form.watch('html')
  const watchSubject = form.watch('subject')
  const previewSubject = renderPreview(watchSubject || '', SAMPLE_PREVIEW_LEAD)

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && isPending) return
        onOpenChange(o)
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">
            {template
              ? t('email.templates.edit', 'Edit Template')
              : t('email.templates.new', 'New Template')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'email.templates.editorDescription',
              'Compose an HTML email template. Use the Insert Variable menu to add merge tags.',
            )}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('email.templates.nameLabel', 'Template name')}{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'email.templates.namePlaceholder',
                          'Welcome series — Day 1',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('email.templates.subjectLabel', 'Subject')}{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'email.templates.subjectPlaceholder',
                          'Hi {firstName}, welcome to Callio!',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'email.templates.descriptionLabel',
                        'Description (internal)',
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t(
                          'email.templates.descriptionPlaceholder',
                          'Internal notes about when to use this template…',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="html"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('email.templates.bodyLabel', 'Email body')}{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Tabs defaultValue="edit">
                      <TabsList className="mb-2">
                        <TabsTrigger value="edit">
                          {t('email.templates.tabEdit', 'Edit')}
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                          {t('email.templates.tabPreview', 'Preview')}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="edit" className="mt-0">
                        <FormControl>
                          <RichTextEmailEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </TabsContent>
                      <TabsContent value="preview" className="mt-0">
                        <div className="flex flex-col gap-2">
                          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                            <span className="font-semibold">
                              {t('email.templates.previewSubject', 'Subject')}:
                            </span>{' '}
                            {previewSubject || (
                              <span className="text-muted-foreground italic">
                                {t(
                                  'email.templates.noSubject',
                                  '(no subject)',
                                )}
                              </span>
                            )}
                          </div>
                          <HtmlEmailPreview html={watchHtml || ''} />
                          <p className="text-xs text-muted-foreground">
                            {t(
                              'email.templates.previewHint',
                              'Showing sample data — recipients will see their own values.',
                            )}
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {template
                  ? t('common.save', 'Save')
                  : t('email.templates.create', 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
