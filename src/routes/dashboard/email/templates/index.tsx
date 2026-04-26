import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EmailTemplate } from '@/lib/api/types/email.types'
import { RoleGuard } from '@/lib/auth-guard'
import { EmailTemplatesList } from '@/components/email/EmailTemplatesList'
import { EmailTemplateEditorSheet } from '@/components/email/EmailTemplateEditorSheet'
import { EmailBlastSheet } from '@/components/email/EmailBlastSheet'
import { EmailBlastJobBanner } from '@/components/email/EmailBlastJobBanner'
import { ServiceInactiveCard } from '@/components/common/ServiceInactiveCard'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { ServiceType } from '@/lib/api/types/services.types'

export const Route = createFileRoute('/dashboard/email/templates/')({
  component: EmailTemplatesPage,
})

function EmailTemplatesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <EmailTemplatesPageContent />
    </RoleGuard>
  )
}

function EmailTemplatesPageContent() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const { data: enabledServices, isLoading: isLoadingServices } =
    useEnabledServices(me?.clientId)
  const hasEmailService = (enabledServices ?? []).some(
    (s) => s.serviceType === ServiceType.EMAIL && s.isEnabled,
  )

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  )
  const [blastOpen, setBlastOpen] = useState(false)
  const [blastTemplate, setBlastTemplate] = useState<EmailTemplate | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  if (isLoadingServices) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasEmailService) {
    return (
      <ServiceInactiveCard
        serviceLabel={t('services.email', 'Email')}
        icon={<Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
      />
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {activeJobId && (
        <EmailBlastJobBanner
          jobId={activeJobId}
          onDismiss={() => setActiveJobId(null)}
        />
      )}

      <EmailTemplatesList
        onCreate={() => {
          setEditingTemplate(null)
          setEditorOpen(true)
        }}
        onEdit={(tpl) => {
          setEditingTemplate(tpl)
          setEditorOpen(true)
        }}
        onBlast={(tpl) => {
          setBlastTemplate(tpl)
          setBlastOpen(true)
        }}
      />

      <EmailTemplateEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
      />

      <EmailBlastSheet
        open={blastOpen}
        onOpenChange={setBlastOpen}
        template={blastTemplate}
        onJobCreated={(jobId) => setActiveJobId(jobId)}
      />
    </div>
  )
}
