import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Trash2,
  Database,
  Shield,
  Zap,
  Loader2,
  X,
  Plus,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { RoleGuard } from '@/lib/auth-guard'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  useWhatsAppInstance,
  useUpdateWhatsAppInstance,
} from '@/hooks/api/useWhatsapp'
import { useAiModels } from '@/hooks/api/useAiModels'
import { useAiProviders } from '@/hooks/api/useAiProviders'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  autoReplyEnabled: z.boolean(),
  autoReplyMode: z.enum(['all', 'whitelist', 'blacklist']),
  autoReplyWhitelist: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      jid: z.string().min(1, 'JID is required'),
    }),
  ),
  autoReplyBlacklist: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      jid: z.string().min(1, 'JID is required'),
    }),
  ),
  aiSystemPrompt: z.string().nullable().optional(),
  aiModelId: z.string().nullable().optional(),
  webhookEnabled: z.boolean(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export const Route = createFileRoute('/dashboard/whatsapp/setting/$id')({
  component: WhatsAppSettingsPage,
})

function WhatsAppSettingsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [contactMode, setContactMode] = useState<'whitelist' | 'blacklist'>(
    'whitelist',
  )
  const [newContact, setNewContact] = useState({ name: '', jid: '' })

  const { data: instance, isLoading: isInstanceLoading } =
    useWhatsAppInstance(id)
  const { data: aiModelsData } = useAiModels({ limit: 100 })
  const { data: aiProvidersData } = useAiProviders({ limit: 100 })
  const updateMutation = useUpdateWhatsAppInstance()

  const aiModels = aiModelsData?.data || []
  const aiProviders = aiProvidersData?.data || []

  // Group models by provider
  const groupedModels = useMemo(() => {
    return aiProviders
      .map((provider) => ({
        provider,
        models: aiModels.filter((m) => m.providerId === provider.id),
      }))
      .filter((group) => group.models.length > 0)
  }, [aiModels, aiProviders])

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      autoReplyEnabled: false,
      autoReplyMode: 'all',
      autoReplyWhitelist: [],
      autoReplyBlacklist: [],
      aiSystemPrompt: '',
      aiModelId: null,
      webhookEnabled: false,
    },
  })

  useEffect(() => {
    if (instance) {
      form.reset({
        name: instance.name,
        autoReplyEnabled: instance.autoReplyEnabled,
        autoReplyMode: instance.autoReplyMode || 'all',
        autoReplyWhitelist: instance.autoReplyWhitelist || [],
        autoReplyBlacklist: instance.autoReplyBlacklist || [],
        aiSystemPrompt: instance.aiSystemPrompt || '',
        aiModelId: instance.aiModelId,
        webhookEnabled: instance.webhookEnabled || false,
      })
    }
  }, [instance, form])

  const autoReplyEnabled = form.watch('autoReplyEnabled')
  const autoReplyMode = form.watch('autoReplyMode')

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...data,
          aiSystemPrompt: data.aiSystemPrompt || null,
          aiModelId: data.aiModelId || null,
        },
      })
      toast.success(
        t('whatsapp.settings.updateSuccess', 'Settings updated successfully'),
      )
    } catch (error) {
      toast.error(
        t('whatsapp.settings.updateError', 'Failed to update settings'),
      )
    }
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.jid) {
      toast.error(
        t('whatsapp.settings.contactError', 'Please fill in both name and JID'),
      )
      return
    }

    const fieldName =
      contactMode === 'whitelist' ? 'autoReplyWhitelist' : 'autoReplyBlacklist'
    const current = form.getValues(fieldName)
    form.setValue(fieldName, [...current, newContact])
    setNewContact({ name: '', jid: '' })
    setIsAddContactOpen(false)
  }

  const removeContact = (mode: 'whitelist' | 'blacklist', index: number) => {
    const fieldName =
      mode === 'whitelist' ? 'autoReplyWhitelist' : 'autoReplyBlacklist'
    const current = form.getValues(fieldName)
    form.setValue(
      fieldName,
      current.filter((_, i) => i !== index),
    )
  }

  const handleModeChange = (newMode: 'all' | 'whitelist' | 'blacklist') => {
    const oldMode = form.getValues('autoReplyMode')
    if (newMode !== oldMode) {
      // Clear whitelist if switching away from it
      if (oldMode === 'whitelist') {
        form.setValue('autoReplyWhitelist', [])
      }
      // Clear blacklist if switching away from it
      if (oldMode === 'blacklist') {
        form.setValue('autoReplyBlacklist', [])
      }
      form.setValue('autoReplyMode', newMode)
    }
  }

  if (isInstanceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full w-full"
        >
          <div className="flex-1 space-y-6 p-8 overflow-y-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/dashboard/whatsapp">
                  <Button variant="ghost" size="icon" type="button">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {t('whatsapp.settings.title', 'Setting Whatsapp Instance')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t(
                      'whatsapp.settings.subtitle',
                      'Configure automation, filtering, and storage for {{phone}}',
                      { phone: instance?.phoneNumber || '+62 812-3456-7890' },
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate({ to: '/dashboard/whatsapp' })}
                >
                  {t('common.discard', 'Discard Changes')}
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('common.save', 'Save Changes')}
                </Button>
              </div>
            </div>

            {/* General Information */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Database className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-base font-medium">
                    {t('whatsapp.settings.generalTitle', 'General Information')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'whatsapp.settings.generalDesc',
                      'Basic information about this WhatsApp instance',
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>
                        {t('whatsapp.settings.instanceName', 'Instance Name')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            'whatsapp.settings.instanceNamePlaceholder',
                            'Enter instance name',
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Auto Reply & Selection */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-medium">
                      {t(
                        'whatsapp.settings.autoReplyTitle',
                        'Auto Reply & Knowledge Base',
                      )}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        'whatsapp.settings.autoReplyDesc',
                        'Enable AI-powered responses based on your data',
                      )}
                    </CardDescription>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="autoReplyEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormLabel className="text-sm font-medium">
                        {t(
                          'whatsapp.settings.enableAutoReply',
                          'Enable AI Auto-Reply',
                        )}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                {autoReplyEnabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="aiModelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              {t(
                                'whatsapp.settings.aiModel',
                                'AI Model Provider',
                              )}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      'whatsapp.settings.selectAiModel',
                                      'Select AI Model',
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {groupedModels.map((group) => (
                                  <SelectGroup key={group.provider.id}>
                                    <SelectLabel>
                                      {group.provider.name}
                                    </SelectLabel>
                                    {group.models.map((model) => (
                                      <SelectItem
                                        key={model.id}
                                        value={model.id}
                                      >
                                        {model.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoReplyMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              {t(
                                'whatsapp.settings.replyMode',
                                'Auto Reply Mode',
                              )}
                            </FormLabel>
                            <Select
                              onValueChange={handleModeChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">
                                  {t(
                                    'whatsapp.settings.modeAll',
                                    'All Contacts',
                                  )}
                                </SelectItem>
                                <SelectItem value="whitelist">
                                  {t(
                                    'whatsapp.settings.modeWhitelist',
                                    'Whitelist Only',
                                  )}
                                </SelectItem>
                                <SelectItem value="blacklist">
                                  {t(
                                    'whatsapp.settings.modeBlacklist',
                                    'Blacklist (Exclude)',
                                  )}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="aiSystemPrompt"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {t(
                              'whatsapp.settings.promptLabel',
                              'AI System Prompt / Knowledge Base',
                            )}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t(
                                'whatsapp.settings.promptPlaceholder',
                                'Provide information about your business, FAQs, and services. The AI will use this content to answer customer queries automatically...',
                              )}
                              className="min-h-[150px]"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground italic">
                            {t(
                              'whatsapp.settings.kbTip',
                              'Tip: Be detailed for more accurate AI responses.',
                            )}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {!autoReplyEnabled && (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                    <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      {t(
                        'whatsapp.settings.autoReplyDisabled',
                        'AI Auto-Reply is disabled',
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      {t(
                        'whatsapp.settings.autoReplyDisabledDesc',
                        'Enable it to configure AI models and rule-based filtering.',
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules & Filtering Sections */}
            {(autoReplyMode === 'whitelist' ||
              autoReplyMode === 'blacklist') && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      autoReplyMode === 'whitelist'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600',
                    )}
                  >
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-medium">
                      {autoReplyMode === 'whitelist'
                        ? t(
                            'whatsapp.settings.whitelistTitle',
                            'Whitelist Filtering',
                          )
                        : t(
                            'whatsapp.settings.blacklistTitle',
                            'Blacklist Filtering',
                          )}
                    </CardTitle>
                    <CardDescription>
                      {autoReplyMode === 'whitelist'
                        ? t(
                            'whatsapp.settings.whitelistDesc',
                            'Only these contacts will receive automated responses',
                          )
                        : t(
                            'whatsapp.settings.blacklistDesc',
                            'These contacts will NEVER receive automated responses',
                          )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'flex items-center gap-2 font-medium',
                          autoReplyMode === 'whitelist'
                            ? 'text-green-600'
                            : 'text-red-600',
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        {autoReplyMode === 'whitelist'
                          ? t('whatsapp.settings.whitelist', 'Whitelist')
                          : t('whatsapp.settings.blacklist', 'Blacklist')}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="text-orange-500 hover:text-orange-600 h-8"
                        onClick={() => {
                          setContactMode(
                            autoReplyMode as 'whitelist' | 'blacklist',
                          )
                          setIsAddContactOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('whatsapp.settings.addContact', 'Add Contact')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(autoReplyMode === 'whitelist'
                        ? form.watch('autoReplyWhitelist')
                        : form.watch('autoReplyBlacklist')
                      ).map((contact, index) => (
                        <div
                          key={`${contact.jid}-${index}`}
                          className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="h-6 w-10 shrink-0 rounded bg-slate-700 text-[10px] text-white flex items-center justify-center font-bold">
                              {contact.jid.includes('@g.us') ? 'GRP' : 'IND'}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">
                                {contact.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {contact.jid}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:text-destructive"
                            type="button"
                            onClick={() =>
                              removeContact(
                                autoReplyMode as 'whitelist' | 'blacklist',
                                index,
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(autoReplyMode === 'whitelist'
                        ? form.watch('autoReplyWhitelist')
                        : form.watch('autoReplyBlacklist')
                      ).length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground italic text-sm">
                          {t(
                            'whatsapp.settings.noContacts',
                            'No contacts added to this list yet.',
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-center text-muted-foreground italic">
                      {autoReplyMode === 'whitelist'
                        ? t(
                            'whatsapp.settings.whitelistTip',
                            'Only these contacts will be processed by the AI.',
                          )
                        : t(
                            'whatsapp.settings.blacklistTip',
                            'All contacts EXCEPT these will be processed by the AI.',
                          )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Storage Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <Database className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-medium">
                      {t(
                        'whatsapp.settings.storageTitle',
                        'Storage Management',
                      )}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        'whatsapp.settings.storageDesc',
                        'Monitor and manage media storage usage',
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" type="button">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('whatsapp.settings.clearStorage', 'Clear Storage')}
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {t('whatsapp.settings.mediaStorage', 'Media Storage')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px]">
                      {t('whatsapp.settings.usageLimit', 'System Managed')}
                    </span>
                  </div>
                  <Progress
                    value={33}
                    className="h-2 bg-slate-100 [&>div]:bg-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {t('whatsapp.settings.images', 'Images')}
                    </p>
                    <p className="text-lg font-bold">42 MB</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {t('whatsapp.settings.videos', 'Videos')}
                    </p>
                    <p className="text-lg font-bold">78 MB</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {t('whatsapp.settings.docs', 'Docs')}
                    </p>
                    <p className="text-lg font-bold">5 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {contactMode === 'whitelist'
                ? t('whatsapp.settings.addWhitelist', 'Add to Whitelist')
                : t('whatsapp.settings.addBlacklist', 'Add to Blacklist')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'whatsapp.settings.contactDesc',
                'Enter the name and WhatsApp JID (phone number or group ID).',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('common.name', 'Name')}
              </Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="col-span-3"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jid" className="text-right">
                {t('whatsapp.jid', 'JID')}
              </Label>
              <Input
                id="jid"
                value={newContact.jid}
                onChange={(e) =>
                  setNewContact({ ...newContact, jid: e.target.value })
                }
                className="col-span-3"
                placeholder="62812345678@s.whatsapp.net"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddContactOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAddContact}>
              {t('common.add', 'Add Contact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}
