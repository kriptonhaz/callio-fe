import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useAiModels } from '@/hooks/api/useAiModels'
import { useGenerateEmailTemplate } from '@/hooks/api/useAiEmailTemplate'
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

  // ---------------------------------------------------------------------
  // AI generation
  // ---------------------------------------------------------------------
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiModelId, setAiModelId] = useState('')
  const generateMut = useGenerateEmailTemplate()

  // Fetch chat-capable models only when the dialog is open.
  const { data: aiModelsPage, isLoading: aiModelsLoading } = useAiModels(
    { capability: 'chat', limit: 50 },
    aiOpen,
  )
  const aiModels = aiModelsPage?.data ?? []

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

  const handleGenerateWithAi = () => {
    if (!aiPrompt.trim() || !aiModelId) return
    generateMut.mutate(
      {
        prompt: aiPrompt.trim(),
        modelId: aiModelId,
        subject: form.getValues('subject') || undefined,
        templateName: form.getValues('name') || undefined,
      },
      {
        onSuccess: (data) => {
          // Insert generated HTML into the form. The editor detects
          // <style> / <html> and auto-locks to View Source mode.
          form.setValue('html', data.html, {
            shouldDirty: true,
            shouldValidate: true,
          })
          // Only fill the subject when the user hasn't typed one yet.
          if (data.subject && !form.getValues('subject')) {
            form.setValue('subject', data.subject, { shouldDirty: true })
          }
          toast.success(
            t(
              'email.templates.aiGenerateSuccess',
              'Email template generated successfully',
            ),
          )
          setAiOpen(false)
          setAiPrompt('')
          setAiModelId('')
        },
        onError: (err) => {
          toast.error(
            err.message ||
              t(
                'email.templates.aiGenerateFailed',
                'Failed to generate email template',
              ),
          )
        },
      },
    )
  }

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
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <TabsList>
                          <TabsTrigger value="edit">
                            {t('email.templates.tabEdit', 'Edit')}
                          </TabsTrigger>
                          <TabsTrigger value="preview">
                            {t('email.templates.tabPreview', 'Preview')}
                          </TabsTrigger>
                        </TabsList>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAiOpen(true)}
                          className="gap-1.5 h-8"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {t(
                            'email.templates.generateWithAi',
                            'Generate with AI',
                          )}
                        </Button>
                      </div>
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

      {/* AI generation modal — mirrors the SMS generator UX. */}
      <Dialog
        open={aiOpen}
        onOpenChange={(o) => {
          if (!o && generateMut.isPending) return
          setAiOpen(o)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                'email.templates.aiDialogTitle',
                'Generate Email Template with AI',
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'email.templates.aiDialogDescription',
                'Describe what you want the email to say. The AI will generate a styled HTML template you can edit and preview.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.aiModel', 'AI Model')}
              </label>
              <Select value={aiModelId} onValueChange={setAiModelId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      aiModelsLoading
                        ? t('common.loading', 'Loading…')
                        : aiModels.length === 0
                          ? t(
                              'email.templates.aiNoModels',
                              'No AI models available',
                            )
                          : t('campaigns.selectAiModel', 'Select AI model')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('campaigns.prompt', 'Prompt')}
              </label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t(
                  'email.templates.aiPromptPlaceholder',
                  "e.g., A welcome email for new customers introducing our product, with a call-to-action button.",
                )}
                className="min-h-[120px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                'email.templates.aiHint',
                'Tip: include the tone (formal, friendly), main offer, and call-to-action. Use {leadName}, {firstName}, etc. for merge tags.',
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiOpen(false)}
              disabled={generateMut.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={
                !aiPrompt.trim() ||
                !aiModelId ||
                generateMut.isPending
              }
              className="gap-2"
            >
              {generateMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.generating', 'Generating…')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t('common.generate', 'Generate')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
