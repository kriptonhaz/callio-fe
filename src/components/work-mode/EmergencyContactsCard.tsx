import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldAlert,
} from 'lucide-react'
import type {
  EmergencyContact,
  Lead,
} from '@/lib/api/types/leads.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isKnownRelation } from '@/lib/leads/relations'

interface Props {
  lead: Lead | null | undefined
  // Called when the agent picks "Call" in the action menu.
  onCall: (contact: EmergencyContact) => void
  // True when calls cannot be placed right now (no SIP, missing context, or
  // another call is in progress). When true the Call menu item is hidden.
  callDisabled?: boolean
  // Called when the agent picks "Send WhatsApp" — undefined to hide that
  // option entirely (e.g. campaign has no WhatsApp service).
  onWhatsApp?: (contact: EmergencyContact) => void
  // True when WhatsApp can't be sent right now (e.g. no connected instance).
  // When true the WhatsApp menu item is hidden.
  whatsAppDisabled?: boolean
  // Called when the agent picks "Send SMS" — undefined to hide that option
  // entirely (e.g. campaign has no SMS service or no active masking).
  onSms?: (contact: EmergencyContact) => void
  smsDisabled?: boolean
}

export function EmergencyContactsCard({
  lead,
  onCall,
  callDisabled,
  onWhatsApp,
  whatsAppDisabled,
  onSms,
  smsDisabled,
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
            onWhatsApp={onWhatsApp ? () => onWhatsApp(c) : undefined}
            whatsAppDisabled={whatsAppDisabled}
            onSms={onSms ? () => onSms(c) : undefined}
            smsDisabled={smsDisabled}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface RowProps {
  contact: EmergencyContact
  onCall: () => void
  callDisabled?: boolean
  onWhatsApp?: () => void
  whatsAppDisabled?: boolean
  onSms?: () => void
  smsDisabled?: boolean
}

function ContactRow({
  contact,
  onCall,
  callDisabled,
  onWhatsApp,
  whatsAppDisabled,
  onSms,
  smsDisabled,
}: RowProps) {
  const { t } = useTranslation()
  const known = isKnownRelation(contact.relation)
  const relationLabel = known
    ? t(
        `leads.relations.${contact.relation.toLowerCase().trim()}`,
        contact.relation,
      )
    : contact.relation || t('leads.relations.other', 'Other')

  const callAvailable = !callDisabled && !!contact.phone
  const waAvailable = !!onWhatsApp && !whatsAppDisabled && !!contact.phone
  const smsAvailable = !!onSms && !smsDisabled && !!contact.phone
  const noActions = !callAvailable && !waAvailable && !smsAvailable

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            disabled={noActions}
            title={
              noActions
                ? t(
                    'leads.emergencyNoActions',
                    'No actions available for this contact right now.',
                  )
                : undefined
            }
          >
            {t('common.action', 'Action')}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {callAvailable && (
            <DropdownMenuItem onClick={onCall}>
              <Phone className="h-4 w-4 mr-2 text-green-600" />
              {t('common.call', 'Call')}
            </DropdownMenuItem>
          )}
          {waAvailable && onWhatsApp && (
            <DropdownMenuItem onClick={onWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2 text-emerald-600" />
              {t('workMode.sendWhatsApp', 'Send WhatsApp')}
            </DropdownMenuItem>
          )}
          {smsAvailable && onSms && (
            <DropdownMenuItem onClick={onSms}>
              <MessageSquare className="h-4 w-4 mr-2 text-violet-600" />
              {t('workMode.sendSms', 'Send SMS')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
