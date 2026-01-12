import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save, Trash2, Database, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { RoleGuard } from '@/lib/auth-guard'
import { Progress } from '@/components/ui/progress'

export const Route = createFileRoute('/dashboard/whatsapp/setting/$id')({
  component: WhatsAppSettingsPage,
})

function WhatsAppSettingsPage() {
  const { t } = useTranslation()

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="flex flex-col h-full space-y-6 p-8 overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/whatsapp">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('whatsapp.settings.title', 'WhatsApp Account Settings')}
              </h1>
              <p className="text-muted-foreground">
                {t(
                  'whatsapp.settings.subtitle',
                  'Configure automation, filtering, and storage for {{phone}}',
                  { phone: '+62 812-3456-7890' },
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <span className="sr-only">Lang</span>
              🌐
            </Button>
            <Button variant="outline" size="icon">
              <span className="sr-only">Theme</span>
              ☀️
            </Button>
            <Button variant="outline" size="icon">
              <span className="sr-only">Notifs</span>
              🔔
            </Button>
          </div>
        </div>

        {/* Auto Reply & Knowledge Base */}
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
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-reply" className="text-sm font-medium">
                {t('whatsapp.settings.enableAutoReply', 'Enable AI Auto-Reply')}
              </Label>
              <Switch id="auto-reply" />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kb">
                {t('whatsapp.settings.kbLabel', 'Enter Knowledge Base')}
              </Label>
              <Textarea
                id="kb"
                placeholder={t(
                  'whatsapp.settings.kbPlaceholder',
                  'Provide information about your business, FAQs, and services. The AI will use this content to answer customer queries automatically...',
                )}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground italic">
                {t(
                  'whatsapp.settings.kbTip',
                  'Tip: Be detailed for more accurate AI responses.',
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rules & Filtering */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-medium">
                {t('whatsapp.settings.rulesTitle', 'Rules & Filtering')}
              </CardTitle>
              <CardDescription>
                {t(
                  'whatsapp.settings.rulesDesc',
                  'Control which contacts receive automated responses',
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Whitelist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <Shield className="h-4 w-4" />
                  {t('whatsapp.settings.whitelist', 'Whitelist')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600 h-8"
                >
                  + {t('whatsapp.settings.addContact', 'Add Contact')}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-10 rounded bg-slate-700 text-xs text-white flex items-center justify-center font-bold">
                    VIP
                  </span>
                  <span className="text-sm font-medium">
                    Internal Sales Team
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <code className="text-muted-foreground">x</code>
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground italic">
                {t(
                  'whatsapp.settings.whitelistTip',
                  'Only these contacts will be processed by the AI.',
                )}
              </p>
            </div>

            {/* Blacklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 font-medium">
                  <Shield className="h-4 w-4" />
                  {t('whatsapp.settings.blacklist', 'Blacklist')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600 h-8"
                >
                  + {t('whatsapp.settings.addContact', 'Add Contact')}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-10 rounded bg-slate-700 text-xs text-white flex items-center justify-center font-bold">
                      GR
                    </span>
                    <span className="text-sm font-medium">Family Group</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <code className="text-muted-foreground">x</code>
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between border">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-10 rounded bg-slate-700 text-xs text-white flex items-center justify-center font-bold">
                      SP
                    </span>
                    <span className="text-sm font-medium">Spam Numbers</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <code className="text-muted-foreground">x</code>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base font-medium">
                  {t('whatsapp.settings.storageTitle', 'Storage Management')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'whatsapp.settings.storageDesc',
                    'Monitor and manage media storage usage',
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline">
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
                  TANSTACK ROUTER
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
                  IMAGES
                </p>
                <p className="text-lg font-bold">42 MB</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  VIDEOS
                </p>
                <p className="text-lg font-bold">78 MB</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  DOCS
                </p>
                <p className="text-lg font-bold">5 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="ghost">
            {t('common.discard', 'Discard Changes')}
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Save className="h-4 w-4 mr-2" />
            {t('common.save', 'Save Changes')}
          </Button>
        </div>
      </div>
    </RoleGuard>
  )
}
