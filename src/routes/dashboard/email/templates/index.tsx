import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { EmailTemplate } from '@/lib/api/types/email.types'
import { RoleGuard } from '@/lib/auth-guard'
import { EmailTemplatesList } from '@/components/email/EmailTemplatesList'
import { EmailTemplateEditorSheet } from '@/components/email/EmailTemplateEditorSheet'
import { EmailBlastSheet } from '@/components/email/EmailBlastSheet'
import { EmailBlastJobBanner } from '@/components/email/EmailBlastJobBanner'

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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  )
  const [blastOpen, setBlastOpen] = useState(false)
  const [blastTemplate, setBlastTemplate] = useState<EmailTemplate | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

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
