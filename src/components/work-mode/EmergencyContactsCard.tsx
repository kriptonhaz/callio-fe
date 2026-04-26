import { useTranslation } from 'react-i18next'
import { Phone, ShieldAlert } from 'lucide-react'
import type {
  EmergencyContact,
  Lead,
} from '@/lib/api/types/leads.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { isKnownRelation } from '@/lib/leads/relations'

interface Props {
  lead: Lead | null | undefined
  // Called when the agent clicks the Call button on a contact row.
  onCall: (contact: EmergencyContact) => void
  // Disable the Call button when the agent can't initiate a call right now
  // (e.g., no SIP credentials, lead/campaign context missing, or another call
  // is already in progress).
  callDisabled: boolean
}

export function EmergencyContactsCard({
  lead,
  onCall,
  callDisabled,
}: Props) {
  const { t } = useTranslation()
  const contacts = lead?.emergencyContacts ?? []

  if (contacts.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          {t('leads.emergencyContacts', 'Emergency Contacts')}
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            ({contacts.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {contacts.map((c, idx) => (
          <ContactRow
            key={c.id ?? `${c.phone}-${idx}`}
            contact={c}
            onCall={() => onCall(c)}
            callDisabled={callDisabled}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface RowProps {
  contact: EmergencyContact
  onCall: () => void
  callDisabled: boolean
}

function ContactRow({ contact, onCall, callDisabled }: RowProps) {
  const { t } = useTranslation()
  const known = isKnownRelation(contact.relation)
  const relationLabel = known
    ? t(
        `leads.relations.${contact.relation.toLowerCase().trim()}`,
        contact.relation,
      )
    : contact.relation || t('leads.relations.other', 'Other')

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col min-w-0 gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{contact.name}</span>
          {relationLabel && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 capitalize shrink-0"
            >
              {relationLabel}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate font-mono">
          {contact.phone}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5 shrink-0"
        onClick={onCall}
        disabled={callDisabled || !contact.phone}
      >
        <Phone className="h-3.5 w-3.5" />
        {t('common.call', 'Call')}
      </Button>
    </div>
  )
}
