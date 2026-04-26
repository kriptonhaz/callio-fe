import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Phone,
  PhoneOff,
  ChevronDown,
  User,
  BrainCircuit,
  Music,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Mail,
  Search,
  X,
} from 'lucide-react'

import type { LeadStatus } from '@/lib/api/types'
import { LeadStatusBadge } from '@/components/lead-status/LeadStatusBadge'
import { LeadStatusSelect } from '@/components/lead-status/LeadStatusSelect'
import type { LeadAssignment } from '@/lib/api/types/lead-assignments.types'
import { ServiceType } from '@/lib/api/types/services.types'

import {
  useLeadAssignments,
  useLeadAssignment,
  useUpdateLeadAssignment,
} from '@/hooks/api/useLeadAssignments'
import { useUpdateLead } from '@/hooks/api/useLeads'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useSipCredentials } from '@/hooks/api/useSipExtensions'
import {
  useInitiateCallSession,
  useDialRecording,
  useHangupCall,
} from '@/hooks/api/useCalls'
import { useInitiateAiAgentCall } from '@/hooks/api/useAiAgentCalls'
import { useSipStore } from '@/store/useSipStore'
import { useDebounce } from '@/hooks/useDebounce'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { VoiceRecordingsDialog } from './VoiceRecordingsDialog'
import { SendWhatsAppSheet } from './SendWhatsAppSheet'
import type { VoiceRecording } from '@/hooks/api/useVoiceRecordings'

import {
  useCampaignLayout,
  useCampaignCustomFieldKeys,
} from '@/hooks/api/useLayoutConfigs'
import { useVoipSettings } from '@/hooks/api/useVoipSettings'
import { useAutoAdvance } from '@/hooks/useAutoAdvance'
import { LayoutRenderer } from '@/components/work-mode/LayoutRenderer'
import { AutoAdvanceBanner } from '@/components/work-mode/AutoAdvanceBanner'
import { WhatsAppHistoryCard } from '@/components/work-mode/WhatsAppHistoryCard'
import { EmailHistoryCard } from '@/components/work-mode/EmailHistoryCard'
import { EmergencyContactsCard } from '@/components/work-mode/EmergencyContactsCard'
import type { EmergencyContact } from '@/lib/api/types/leads.types'
import { ComposeDialog } from '@/components/email/ComposeDialog'
import { useEmailAccounts } from '@/hooks/api/useEmail'
import {
  leadToFormValues,
  type LeadFormValues,
} from '@/lib/layout/lead-value'
import {
  buildDefaultLayout,
  mergeDiscoveredCustomKeys,
} from '@/lib/layout/default-layout'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkModeProps {
  campaignId: string
  clientId: string
  currentIndex?: number
  onIndexChange?: (index: number) => void
  campaignServices?: { serviceType: string }[]
  batchDate?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm')
  } catch {
    return value
  }
}

function normalizePhone(phone: string): string {
  if (phone.startsWith('+62')) return '0' + phone.slice(3)
  if (phone.startsWith('62')) return '0' + phone.slice(2)
  return phone
}

// ---------------------------------------------------------------------------
// Sub-component: WhatsApp status icon
// ---------------------------------------------------------------------------

function WhatsAppStatusIcon({
  hasWhatsapp,
}: {
  hasWhatsapp?: boolean | null
}) {
  if (hasWhatsapp === true) {
    return <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />
  }
  if (hasWhatsapp === false) {
    return <XCircle className="inline h-4 w-4 text-red-500 ml-1" />
  }
  return <HelpCircle className="inline h-4 w-4 text-muted-foreground ml-1" />
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WorkMode({
  campaignId,
  clientId,
  campaignServices,
  currentIndex: externalIndex,
  onIndexChange,
  batchDate,
}: WorkModeProps) {
  const { t } = useTranslation()

  // -------------------------------------------------------------------------
  // Auth / current user
  // -------------------------------------------------------------------------
  const { data: currentUser } = useMe()

  // -------------------------------------------------------------------------
  // Navigation & filter state
  // -------------------------------------------------------------------------
  const [internalIndex, setInternalIndex] = useState(externalIndex ?? 1)
  const currentIndex = externalIndex ?? internalIndex
  const setCurrentIndex = (index: number) => {
    setInternalIndex(index)
    onIndexChange?.(index)
  }
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [lockedPhone, setLockedPhone] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [goToPageInput, setGoToPageInput] = useState<string>('')

  // -------------------------------------------------------------------------
  // Lead info form state — single record keyed by field.key
  // -------------------------------------------------------------------------
  const [formValues, setFormValues] = useState<LeadFormValues>({})

  // -------------------------------------------------------------------------
  // Outcome form state
  // -------------------------------------------------------------------------
  const [outcomeStatus, setOutcomeStatus] = useState<LeadStatus | ''>('')
  const [outcomeNotes, setOutcomeNotes] = useState('')

  // -------------------------------------------------------------------------
  // Call UI state
  // -------------------------------------------------------------------------
  const [callOptionsOpen, setCallOptionsOpen] = useState(false)
  const [callMode, setCallMode] = useState<'live' | 'recording'>('live')
  const [selectedRecording, setSelectedRecording] =
    useState<VoiceRecording | null>(null)
  const [showRecordingsDialog, setShowRecordingsDialog] = useState(false)
  const [isPollingForCall, setIsPollingForCall] = useState(false)
  const [callWasActive, setCallWasActive] = useState(false)
  const [recordingCallLogId, setRecordingCallLogId] = useState<string | null>(
    null,
  )

  // Auto-advance signal bus — bumps when any call (live SIP, AI, recording) ends.
  const [callEndedSignal, setCallEndedSignal] = useState(0)
  const [agentPlacedCall, setAgentPlacedCall] = useState(false)
  // Window end timestamp during which we keep polling the assignment so the
  // backend-written lastCallStatus is visible to the auto-advance hook.
  const [postCallPollUntil, setPostCallPollUntil] = useState(0)

  // -------------------------------------------------------------------------
  // WhatsApp sheet state
  // -------------------------------------------------------------------------
  const [whatsappSheetOpen, setWhatsappSheetOpen] = useState(false)
  const [emailComposeOpen, setEmailComposeOpen] = useState(false)
  const [emailAccountId, setEmailAccountId] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Main paginator is driven by the locked phone only (when a lead is picked
  // from the autocomplete). Typing in the search input does NOT affect the
  // paginator — it only drives the suggestions list.
  const { data, isLoading } = useLeadAssignments({
    campaignId,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as LeadStatus),
    batchDate: batchDate || undefined,
    search: lockedPhone ?? undefined,
    page: currentIndex,
    limit: 1,
  })

  // Separate search query for the autocomplete dropdown. Only runs when the
  // dropdown is open and the user has typed at least 2 characters.
  const { data: searchResults } = useLeadAssignments(
    {
      campaignId,
      status:
        statusFilter === 'all' ? undefined : (statusFilter as LeadStatus),
      batchDate: batchDate || undefined,
      search: debouncedSearch || undefined,
      page: 1,
      limit: 10,
    },
    searchOpen && debouncedSearch.trim().length >= 2,
  )

  const listAssignment: LeadAssignment | undefined = data?.data[0]
  const totalLeads = data?.meta.total ?? 0

  // -------------------------------------------------------------------------
  // VoIP settings (auto-advance after call)
  // -------------------------------------------------------------------------
  const { data: voipSettings } = useVoipSettings()

  // Email accounts available to the current user — drives the "Send Email"
  // button visibility + the composer's from-selector.
  const { data: emailAccounts } = useEmailAccounts()
  useEffect(() => {
    if (!emailAccountId && emailAccounts && emailAccounts.length > 0) {
      setEmailAccountId(emailAccounts[0].id)
    }
  }, [emailAccounts, emailAccountId])

  // -------------------------------------------------------------------------
  // Layout config
  // -------------------------------------------------------------------------
  const { data: layoutResp } = useCampaignLayout(campaignId)
  const { data: customKeysResp } = useCampaignCustomFieldKeys(campaignId)
  const resolvedLayout = useMemo(() => {
    const base = layoutResp?.layout ?? buildDefaultLayout()
    return mergeDiscoveredCustomKeys(base, customKeysResp?.keys ?? [])
  }, [layoutResp, customKeysResp])

  // Fetch full assignment detail (includes previousAssignments)
  const { data: detailAssignment } = useLeadAssignment(listAssignment?.id)
  const assignment: LeadAssignment | undefined = detailAssignment
    ? { ...listAssignment, ...detailAssignment }
    : listAssignment

  // -------------------------------------------------------------------------
  // VoIP / SIP
  // -------------------------------------------------------------------------
  const { data: enabledServices } = useEnabledServices(clientId)
  const { data: sipCredentials } = useSipCredentials()

  const isVoipEnabled = enabledServices?.some(
    (s) => s.serviceType === ServiceType.VOICE && s.isEnabled,
  )
  const campaignHasVoipService = campaignServices?.some(
    (s) => s.serviceType === ServiceType.VOICE || s.serviceType === 'voice',
  )
  const userHasSipExtension = !!sipCredentials

  const makeCall = useSipStore((state) => state.makeCall)
  const hangup = useSipStore((state) => state.hangup)
  const callStatus = useSipStore((state) => state.callStatus)
  const sipmlReady = useSipStore((state) => state.sipmlReady)
  const sipStatus = useSipStore((state) => state.status)
  const isRegistered =
    sipStatus === 'connected' || sipStatus === 'registered'

  const isDialing =
    callStatus === 'calling' || callStatus === 'connecting'
  const isCallActive =
    callStatus === 'active' ||
    callStatus === 'ringing' ||
    callStatus === 'connecting' ||
    callStatus === 'calling'

  const { mutate: initiateSession, isPending: isInitiatingSession } =
    useInitiateCallSession()
  const { mutate: dialRecording, isPending: isDialingRecording } =
    useDialRecording()
  const { mutate: hangupCall, isPending: isHangingUp } = useHangupCall()
  const { mutate: initiateAiAgentCall, isPending: isInitiatingAiCall } =
    useInitiateAiAgentCall()

  // Poll assignment to detect active-call changes AND to pick up the
  // backend-written lastCallStatus within a few seconds after any call ends.
  const isInPostCallPoll = postCallPollUntil > 0 && Date.now() < postCallPollUntil
  const { data: polledAssignment } = useLeadAssignment(assignment?.id, {
    refetchInterval: isPollingForCall || isInPostCallPoll ? 1000 : false,
  })
  const activeCallData = polledAssignment?.activeCall ?? assignment?.activeCall

  useEffect(() => {
    if (isPollingForCall && polledAssignment?.activeCall) {
      setCallWasActive(true)
    }
  }, [isPollingForCall, polledAssignment?.activeCall])

  useEffect(() => {
    if (
      isPollingForCall &&
      callWasActive &&
      polledAssignment &&
      !polledAssignment.activeCall
    ) {
      setIsPollingForCall(false)
      setCallWasActive(false)
      setRecordingCallLogId(null)
      setCallEndedSignal((n) => n + 1)
      setPostCallPollUntil(Date.now() + 35_000)
    }
  }, [isPollingForCall, callWasActive, polledAssignment])

  // Detect live SIP call end via callStatus transition (active → ended/idle).
  const prevCallStatusRef = useRef(callStatus)
  useEffect(() => {
    const prev = prevCallStatusRef.current
    const wasActive =
      prev === 'active' ||
      prev === 'ringing' ||
      prev === 'calling' ||
      prev === 'connecting'
    const isActive =
      callStatus === 'active' ||
      callStatus === 'ringing' ||
      callStatus === 'calling' ||
      callStatus === 'connecting'
    if (wasActive && !isActive) {
      setCallEndedSignal((n) => n + 1)
      setPostCallPollUntil(Date.now() + 35_000)
    }
    prevCallStatusRef.current = callStatus
  }, [callStatus])

  // -------------------------------------------------------------------------
  // Update assignment mutation
  // -------------------------------------------------------------------------
  const { mutate: updateAssignment, isPending: isSaving } =
    useUpdateLeadAssignment()
  const { mutate: updateLead, isPending: isSavingLead } = useUpdateLead()

  // -------------------------------------------------------------------------
  // Reset form when navigating leads
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (assignment) {
      setOutcomeStatus(assignment.status ?? '')
      setOutcomeNotes(assignment.leadProgressNotes ?? '')
      setFormValues(leadToFormValues(assignment.lead))
    } else {
      setOutcomeStatus('')
      setOutcomeNotes('')
      setFormValues({})
    }
    setAgentPlacedCall(false)
  }, [currentIndex, assignment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Reset index when filter changes
  // -------------------------------------------------------------------------
  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentIndex(1)
  }

  // Reset paginator when the locked phone changes (including clear)
  useEffect(() => {
    setCurrentIndex(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedPhone])

  const handleGoToPage = () => {
    const n = parseInt(goToPageInput, 10)
    if (!Number.isFinite(n)) return
    const clamped = Math.max(1, Math.min(totalLeads, n))
    setCurrentIndex(clamped)
    setGoToPageInput('')
  }

  // -------------------------------------------------------------------------
  // Save outcome
  // -------------------------------------------------------------------------
  const handleSaveOutcome = () => {
    if (!assignment?.id) return

    updateAssignment(
      {
        id: assignment.id,
        data: {
          status: outcomeStatus !== '' ? (outcomeStatus as LeadStatus) : undefined,
          leadProgressNotes: outcomeNotes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('workMode.outcomeSaved', 'Outcome saved'))
        },
        onError: (error) => {
          toast.error(
            error.message ?? t('workMode.outcomeSaveFailed', 'Failed to save outcome'),
          )
        },
      },
    )
  }

  // -------------------------------------------------------------------------
  // Save lead info
  // -------------------------------------------------------------------------
  const handleSaveLeadInfo = () => {
    if (!assignment?.lead?.id) return

    const str = (k: string): string | undefined => {
      const v = formValues[k]
      if (v === undefined || v === null) return undefined
      const s = String(v).trim()
      return s === '' ? undefined : s
    }
    const strOrNull = (k: string): string | null => str(k) ?? null
    const intOrNull = (k: string): number | null => {
      const s = str(k)
      return s ? parseInt(s, 10) : null
    }
    const cf = formValues.customFields as Record<string, string> | null | undefined

    updateLead(
      {
        id: assignment.lead.id,
        data: {
          leadName: str('leadName'),
          phone: str('phone'),
          email: strOrNull('email'),
          gender: strOrNull('gender'),
          dateOfBirth: strOrNull('dateOfBirth'),
          address: strOrNull('address'),
          city: strOrNull('city'),
          province: strOrNull('province'),
          postalCode: strOrNull('postalCode'),
          occupation: strOrNull('occupation'),
          jobTitle: strOrNull('jobTitle'),
          companyName: strOrNull('companyName'),
          officeAddress: strOrNull('officeAddress'),
          salaryMin: intOrNull('salaryMin'),
          salaryMax: intOrNull('salaryMax'),
          tags: strOrNull('tags'),
          notes: strOrNull('notes'),
          customFields: cf && Object.keys(cf).length > 0 ? cf : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('workMode.leadSaved', 'Lead info saved'))
        },
        onError: (error) => {
          toast.error(
            error.message ?? t('workMode.leadSaveFailed', 'Failed to save lead info'),
          )
        },
      },
    )
  }

  // -------------------------------------------------------------------------
  // Auto-advance after call
  // -------------------------------------------------------------------------
  const initiateLiveCall = useCallback(() => {
    const currentLead = assignment?.lead
    if (!currentLead?.phone || !currentLead?.id) return
    if (!sipCredentials || !currentUser?.id) return
    if (!isRegistered) {
      toast.error(
        t(
          'leads.sipDisconnected',
          'SIP disconnected, please dial manually',
        ),
      )
      return
    }
    setCallMode('live')
    setSelectedRecording(null)
    const dialNumber = normalizePhone(currentLead.phone)
    initiateSession(
      {
        campaignId,
        leadId: currentLead.id,
        phoneNumber: currentLead.phone,
        agentId: currentUser.id,
      },
      {
        onSuccess: (sessionData) => {
          const dialExtension = `${dialNumber}*${sessionData.sessionToken}`
          makeCall(dialExtension, sipCredentials.server)
        },
        onError: () => {
          toast.error(
            t(
              'leads.sessionInitFailed',
              'Failed to initiate call session',
            ),
          )
        },
      },
    )
  }, [
    assignment?.lead,
    sipCredentials,
    currentUser?.id,
    isRegistered,
    campaignId,
    initiateSession,
    makeCall,
    t,
  ])

  const campaignHasVoip = !!campaignServices?.some(
    (s) => s.serviceType === ServiceType.VOICE || s.serviceType === 'voice',
  )

  const { secondsLeft, totalSeconds, cancel: cancelAutoAdvance } =
    useAutoAdvance({
      settings: voipSettings,
      prerequisites: {
        campaignHasVoip,
        sipRegistered: isRegistered,
        agentPlacedCall,
      },
      currentIndex,
      isLastLead: currentIndex >= totalLeads,
      getCurrentStatus: () => polledAssignment?.lastCallStatus ?? null,
      callEndedSignal,
      onAdvance: () => {
        if (currentIndex < totalLeads) setCurrentIndex(currentIndex + 1)
      },
      onAutoDial: initiateLiveCall,
    })

  // Live SIP call to one of the lead's emergency contacts. Same flow as the
  // primary live call (session is still attributed to the lead via leadId),
  // but dials the contact's phone number instead.
  const dialEmergencyContact = useCallback(
    (contact: EmergencyContact) => {
      const currentLead = assignment?.lead
      if (!currentLead?.id) return
      if (!contact.phone) return
      if (!sipCredentials || !currentUser?.id) return
      if (!isRegistered) {
        toast.error(
          t(
            'leads.sipDisconnected',
            'SIP disconnected, please dial manually',
          ),
        )
        return
      }
      setCallMode('live')
      setSelectedRecording(null)
      setAgentPlacedCall(true)
      cancelAutoAdvance()
      const dialNumber = normalizePhone(contact.phone)
      initiateSession(
        {
          campaignId,
          leadId: currentLead.id,
          phoneNumber: contact.phone,
          agentId: currentUser.id,
        },
        {
          onSuccess: (sessionData) => {
            const dialExtension = `${dialNumber}*${sessionData.sessionToken}`
            makeCall(dialExtension, sipCredentials.server)
            toast.success(
              t('workMode.callingEmergency', 'Calling {{name}}', {
                name: contact.name,
              }),
            )
          },
          onError: () => {
            toast.error(
              t(
                'leads.sessionInitFailed',
                'Failed to initiate call session',
              ),
            )
          },
        },
      )
    },
    [
      assignment?.lead,
      sipCredentials,
      currentUser?.id,
      isRegistered,
      campaignId,
      cancelAutoAdvance,
      initiateSession,
      makeCall,
      t,
    ],
  )

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Empty states
  // -------------------------------------------------------------------------
  if (totalLeads === 0 && statusFilter === 'all') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Users className="h-10 w-10" />
        <p className="text-sm">{t('workMode.noLeads', 'No leads found')}</p>
      </div>
    )
  }

  if (totalLeads === 0 && statusFilter !== 'all') {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        {/* Keep header so filter can be changed */}
        <div className="flex items-center gap-3 mb-4">
          <LeadStatusSelect
            value={statusFilter}
            onValueChange={handleFilterChange}
            includeAll
            className="w-36"
          />
        </div>
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('workMode.noLeadsFilter', 'No leads matching the selected filter')}
        </p>
      </div>
    )
  }

  const lead = assignment?.lead

  // -------------------------------------------------------------------------
  // Derived call permission flags
  // -------------------------------------------------------------------------
  const showCallControls =
    !!isVoipEnabled &&
    !!campaignHasVoipService &&
    !!userHasSipExtension &&
    !!lead?.phone

  const isDialingAny =
    isDialing || isDialingRecording || isInitiatingAiCall || isInitiatingSession

  const campaignHasWhatsapp = campaignServices?.some(
    (s) => s.serviceType === ServiceType.WHATSAPP || s.serviceType === 'whatsapp',
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {secondsLeft !== null && (
        <AutoAdvanceBanner
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          autoDial={voipSettings?.autoAdvanceLiveCall}
          onCancel={cancelAutoAdvance}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Header bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 1}
              onClick={() => setCurrentIndex(Math.max(1, currentIndex - 1))}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('workMode.prev', 'Prev')}
            </Button>

            <span className="text-sm text-muted-foreground whitespace-nowrap px-2">
              {t('workMode.leadXofY', 'Lead {{x}} of {{y}}', {
                x: currentIndex,
                y: totalLeads,
              })}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex >= totalLeads}
              onClick={() =>
                setCurrentIndex(Math.min(totalLeads, currentIndex + 1))
              }
              className="gap-1"
            >
              {t('workMode.next', 'Next')}
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Go to page */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {t('workMode.goTo', 'Go to')}
              </span>
              <Input
                type="number"
                min={1}
                max={totalLeads || 1}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleGoToPage()
                  }
                }}
                placeholder="#"
                className="h-8 w-16 text-sm"
                disabled={totalLeads === 0}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleGoToPage}
                disabled={!goToPageInput || totalLeads === 0}
                className="h-8"
              >
                {t('workMode.go', 'Go')}
              </Button>
            </div>
          </div>

          {/* Status filter */}
          <LeadStatusSelect
            value={statusFilter}
            onValueChange={handleFilterChange}
            includeAll
            className="w-36"
          />
        </div>

        {/* Search by lead name (autocomplete) */}
        <div className="flex items-center gap-2 max-w-md">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t(
                    'workMode.searchLead',
                    'Search by lead name or phone…',
                  )}
                  className="h-9 pl-8"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="p-0 w-[var(--radix-popover-trigger-width)]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {debouncedSearch.trim().length < 2 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  {t(
                    'workMode.searchHint',
                    'Type at least 2 characters to search.',
                  )}
                </div>
              ) : (searchResults?.data.length ?? 0) === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  {t('workMode.noMatches', 'No matching leads.')}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto py-1">
                  {searchResults?.data.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        if (!a.lead?.phone) return
                        setLockedPhone(a.lead.phone)
                        setSearchQuery(
                          `${a.lead.leadName} — ${a.lead.phone}`,
                        )
                        setSearchOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                    >
                      <span className="font-medium truncate">
                        {a.lead?.leadName ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {a.lead?.phone ?? '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {lockedPhone && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLockedPhone(null)
                setSearchQuery('')
              }}
              className="h-9 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {t('workMode.clearSearch', 'Clear')}
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Left column — Lead information                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Save bar */}
          <div className="flex items-center justify-between">
            {lead?.phone && (
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                {t('leads.phone', 'Phone')}:
                <span className="font-medium">{lead.phone}</span>
                <WhatsAppStatusIcon hasWhatsapp={lead.hasWhatsapp} />
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveLeadInfo}
              disabled={isSavingLead}
              className="ml-auto"
            >
              {isSavingLead && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {t('common.save', 'Save')}
            </Button>
          </div>

          {/* Render configurable sections from layout config */}
          <LayoutRenderer
            layout={resolvedLayout}
            values={formValues}
            onChange={setFormValues}
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right column — Action panel                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('workMode.actions', 'Actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Call controls */}
              {showCallControls && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Hangup — live SIP call */}
                  {isCallActive ? (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => hangup()}
                    >
                      <PhoneOff className="h-4 w-4" />
                      {t('leads.hangup', 'Hang Up')}
                    </Button>
                  ) : /* Hangup — recording call */
                  recordingCallLogId ? (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      disabled={isHangingUp}
                      onClick={() => {
                        hangupCall(
                          { callLogId: recordingCallLogId },
                          {
                            onSuccess: () => {
                              toast.success(t('leads.callEnded', 'Call ended'))
                              setRecordingCallLogId(null)
                              setIsPollingForCall(false)
                              setCallWasActive(false)
                            },
                            onError: (error) => {
                              toast.error(
                                error.message ??
                                  t(
                                    'leads.hangupFailed',
                                    'Failed to hang up call',
                                  ),
                              )
                            },
                          },
                        )
                      }}
                    >
                      {isHangingUp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PhoneOff className="h-4 w-4" />
                      )}
                      {t('leads.hangup', 'Hang Up')}
                    </Button>
                  ) : (
                    /* Call dropdown */
                    <Popover
                      open={callOptionsOpen}
                      onOpenChange={setCallOptionsOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="default"
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                          disabled={
                            !!activeCallData ||
                            isPollingForCall ||
                            isDialingAny
                          }
                        >
                          {isDialingAny ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                          {t('leads.call', 'Call')}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-44 p-1"
                        side="bottom"
                        align="start"
                      >
                        <div className="flex flex-col gap-1">
                          {/* Live call */}
                          <Button
                            type="button"
                            variant={callMode === 'live' ? 'default' : 'ghost'}
                            size="sm"
                            className="justify-start gap-2 h-9"
                            disabled={
                              !isRegistered ||
                              !sipmlReady ||
                              isInitiatingSession ||
                              !currentUser
                            }
                            title={
                              !isRegistered
                                ? t(
                                    'leads.connectToSipFirst',
                                    'Please connect to SIP first',
                                  )
                                : undefined
                            }
                            onClick={() => {
                              if (!lead?.phone || !lead?.id) return
                              if (!sipCredentials || !currentUser?.id) return

                              setCallOptionsOpen(false)
                              setCallMode('live')
                              setSelectedRecording(null)
                              setAgentPlacedCall(true)
                              cancelAutoAdvance()

                              const dialNumber = normalizePhone(lead.phone)

                              initiateSession(
                                {
                                  campaignId,
                                  leadId: lead.id,
                                  phoneNumber: lead.phone,
                                  agentId: currentUser.id,
                                },
                                {
                                  onSuccess: (data) => {
                                    const dialExtension = `${dialNumber}*${data.sessionToken}`
                                    makeCall(
                                      dialExtension,
                                      sipCredentials.server,
                                    )
                                  },
                                  onError: () => {
                                    toast.error(
                                      t(
                                        'leads.sessionInitFailed',
                                        'Failed to initiate call session',
                                      ),
                                    )
                                  },
                                },
                              )
                            }}
                          >
                            <User className="h-4 w-4" />
                            {t('leads.liveVoice', 'Live')}
                          </Button>

                          {/* AI Agent */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2 h-9"
                            onClick={() => {
                              if (!lead?.phone || !lead?.id) return

                              setCallOptionsOpen(false)
                              setAgentPlacedCall(true)
                              cancelAutoAdvance()
                              const dialNumber = normalizePhone(lead.phone)

                              initiateAiAgentCall(
                                {
                                  destinationNumber: dialNumber,
                                  aiAgentConfigId: undefined,
                                  leadId: lead.id,
                                  campaignId,
                                },
                                {
                                  onSuccess: () => {
                                    toast.success(
                                      t(
                                        'leads.aiCallInitiated',
                                        'AI agent call initiated',
                                      ),
                                    )
                                  },
                                  onError: (error) => {
                                    toast.error(
                                      error.message ??
                                        t(
                                          'leads.aiCallFailed',
                                          'Failed to initiate AI agent call',
                                        ),
                                    )
                                  },
                                },
                              )
                            }}
                          >
                            <BrainCircuit className="h-4 w-4" />
                            {t('leads.aiAgent', 'AI Agent')}
                          </Button>

                          {/* Recording */}
                          <Button
                            type="button"
                            variant={
                              callMode === 'recording' ? 'default' : 'ghost'
                            }
                            size="sm"
                            className="justify-start gap-2 h-9"
                            onClick={() => {
                              setCallOptionsOpen(false)
                              setShowRecordingsDialog(true)
                            }}
                          >
                            <Music className="h-4 w-4" />
                            {selectedRecording
                              ? selectedRecording.name.substring(0, 12) +
                                (selectedRecording.name.length > 12 ? '...' : '')
                              : t('leads.recording', 'Recording')}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              {/* WhatsApp button */}
              {campaignHasWhatsapp && lead?.phone && (
                <Button
                  variant="outline"
                  className="gap-2 self-start"
                  onClick={() => setWhatsappSheetOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('workMode.sendWhatsApp', 'Send WhatsApp')}
                </Button>
              )}

              {/* Send Email button */}
              {(emailAccounts?.length ?? 0) > 0 && (
                <Button
                  variant="outline"
                  className="gap-2 self-start"
                  disabled={!lead?.email}
                  title={
                    lead?.email
                      ? undefined
                      : t(
                          'workMode.emailDisabled',
                          "This lead has no email address — fill it in first to send email.",
                        )
                  }
                  onClick={() => setEmailComposeOpen(true)}
                >
                  <Mail className="h-4 w-4" />
                  {t('workMode.sendEmail', 'Send Email')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <EmergencyContactsCard
            lead={lead}
            onCall={dialEmergencyContact}
            callDisabled={
              isCallActive ||
              isDialingAny ||
              !sipCredentials ||
              !currentUser?.id ||
              !lead?.id ||
              !campaignHasVoip
            }
          />

          {/* WhatsApp History */}
          <WhatsAppHistoryCard lead={lead} />

          {/* Email History */}
          <EmailHistoryCard lead={lead} />

          {/* Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('workMode.outcome', 'Outcome')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {t('common.status', 'Status')}
                </label>
                <LeadStatusSelect
                  value={outcomeStatus}
                  onValueChange={setOutcomeStatus}
                  placeholder={t('workMode.selectStatus', 'Select status')}
                />
              </div>

              {/* Last Call Status — read-only, backend-derived */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('leads.lastCallStatus', 'Last Call Status')}
                </label>
                {assignment?.lastCallStatus ? (
                  <Badge variant="secondary" className="w-fit capitalize">
                    {assignment.lastCallStatus.replace(/_/g, ' ')}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Progress Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {t('leads.progressNotes', 'Progress Notes')}
                </label>
                <Textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder={t(
                    'workMode.notesPlaceholder',
                    'Add notes about this lead...',
                  )}
                  rows={3}
                />
              </div>

              {/* Save button */}
              <Button
                onClick={handleSaveOutcome}
                disabled={isSaving || !assignment?.id}
                className="self-end"
              >
                {isSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.save', 'Save')}
              </Button>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('workMode.activity', 'Activity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.lastCallStatus', 'Last Outcome')}
                </span>
                {assignment?.lastCallStatus ? (
                  <Badge variant="secondary" className="capitalize">
                    {assignment.lastCallStatus.replace(/_/g, ' ')}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.followupCount', 'Attempts')}
                </span>
                <span className="font-semibold">
                  {assignment?.followupCount ?? 0}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.lastContacted', 'Last Contacted')}
                </span>
                <span>{formatDate(assignment?.lastContactedAt)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.nextFollowUp', 'Next Follow-up')}
                </span>
                <span>{formatDate(assignment?.nextFollowUpAt)}</span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('common.createdAt', 'Created')}</span>
                <span>{formatDate(assignment?.createdAt)}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('common.updatedAt', 'Updated')}</span>
                <span>{formatDate(assignment?.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Previous Assignments */}
          {assignment?.previousAssignments &&
            assignment.previousAssignments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t('workMode.previousAssignments', 'Previous Assignments')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {assignment.previousAssignments.map((prev) => {
                    const attempts = prev.followupCount ?? 0
                    const hadCalls = attempts > 0 || !!prev.lastCallStatus
                    return (
                      <div
                        key={prev.id}
                        className="rounded-lg border p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {format(new Date(prev.batchDate), 'dd MMM yyyy')}
                          </span>
                          <LeadStatusBadge slug={prev.status} />
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {prev.assignedAgent && (
                            <span>
                              <span className="text-muted-foreground/70">
                                {t('leads.agent', 'Agent')}:
                              </span>{' '}
                              <span className="text-foreground">
                                {prev.assignedAgent.name}
                              </span>
                            </span>
                          )}
                          <span>
                            <span className="text-muted-foreground/70">
                              {t('leads.followupCount', 'Attempts')}:
                            </span>{' '}
                            <span className="text-foreground">{attempts}</span>
                          </span>
                        </div>

                        {prev.lastCallStatus && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {t('leads.lastCallStatus', 'Last Outcome')}:
                            </span>
                            <Badge
                              variant="secondary"
                              className="capitalize text-[10px] h-5"
                            >
                              {prev.lastCallStatus.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        )}

                        {!hadCalls && (
                          <p className="text-xs italic text-muted-foreground">
                            {t(
                              'leads.noCallsAttempted',
                              'No calls were attempted during this assignment.',
                            )}
                          </p>
                        )}

                        {prev.leadProgressNotes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              {t('leads.progressNotes', 'Notes')}:
                            </span>
                            <p className="mt-0.5 whitespace-pre-wrap">
                              {prev.leadProgressNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Voice Recordings Dialog                                             */}
      {/* ------------------------------------------------------------------ */}
      <VoiceRecordingsDialog
        open={showRecordingsDialog}
        onOpenChange={setShowRecordingsDialog}
        selectedRecordingId={selectedRecording?.id}
        isDialing={isDialingRecording}
        onSelect={(recording) => {
          setSelectedRecording(recording)
          setCallMode(recording ? 'recording' : 'live')
        }}
        onCall={(recording) => {
          if (!lead?.phone || !lead?.id) return

          setAgentPlacedCall(true)
          cancelAutoAdvance()
          const dialNumber = normalizePhone(lead.phone)

          dialRecording(
            {
              destinationNumber: dialNumber,
              voiceRecordingId: recording.id,
              leadId: lead.id,
              campaignId,
            },
            {
              onSuccess: (data) => {
                setRecordingCallLogId(data.callLogId)
                setIsPollingForCall(true)
                setShowRecordingsDialog(false)
                toast.success(
                  t('leads.callInitiated', 'Call initiated with recording'),
                )
              },
              onError: (error) => {
                toast.error(
                  error.message ??
                    t('leads.callFailed', 'Failed to initiate call'),
                )
              },
            },
          )
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Send WhatsApp Sheet                                                 */}
      {/* ------------------------------------------------------------------ */}
      {campaignHasWhatsapp && lead?.phone && (
        <SendWhatsAppSheet
          open={whatsappSheetOpen}
          onOpenChange={setWhatsappSheetOpen}
          leadPhone={lead.phone}
          leadName={lead.leadName}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Send Email compose dialog                                           */}
      {/* ------------------------------------------------------------------ */}
      <ComposeDialog
        open={emailComposeOpen}
        onOpenChange={setEmailComposeOpen}
        accountId={emailAccountId}
        accountEmail={
          emailAccounts?.find((a) => a.id === emailAccountId)?.email
        }
        accounts={emailAccounts}
        onAccountIdChange={setEmailAccountId}
        lead={lead}
        initial={{
          to: lead?.email ? [lead.email] : [],
        }}
      />
    </div>
  )
}
