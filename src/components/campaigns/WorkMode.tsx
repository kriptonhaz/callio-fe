import { useState, useEffect } from 'react'
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
} from 'lucide-react'

import { LeadStatus } from '@/lib/api/types'
import { LastCallStatus } from '@/lib/api/types/lead-assignments.types'
import type { LeadAssignment } from '@/lib/api/types/lead-assignments.types'
import { ServiceType } from '@/lib/api/types/services.types'

import {
  useLeadAssignments,
  useLeadAssignment,
  useUpdateLeadAssignment,
} from '@/hooks/api/useLeadAssignments'
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { VoiceRecordingsDialog } from './VoiceRecordingsDialog'
import { SendWhatsAppSheet } from './SendWhatsAppSheet'
import type { VoiceRecording } from '@/hooks/api/useVoiceRecordings'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkModeProps {
  campaignId: string
  clientId: string
  campaignServices?: { serviceType: string }[]
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

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '-'
  try {
    return format(new Date(value), 'dd MMM yyyy')
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
// Sub-component: Info Row
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-words">{children}</span>
    </div>
  )
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
}: WorkModeProps) {
  const { t } = useTranslation()

  // -------------------------------------------------------------------------
  // Auth / current user
  // -------------------------------------------------------------------------
  const { data: currentUser } = useMe()

  // -------------------------------------------------------------------------
  // Navigation & filter state
  // -------------------------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // -------------------------------------------------------------------------
  // Outcome form state
  // -------------------------------------------------------------------------
  const [outcomeStatus, setOutcomeStatus] = useState<LeadStatus | ''>('')
  const [outcomeLastCallStatus, setOutcomeLastCallStatus] = useState<
    LastCallStatus | ''
  >('')
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

  // -------------------------------------------------------------------------
  // WhatsApp sheet state
  // -------------------------------------------------------------------------
  const [whatsappSheetOpen, setWhatsappSheetOpen] = useState(false)

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const { data, isLoading } = useLeadAssignments({
    campaignId,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as LeadStatus),
    page: currentIndex,
    limit: 1,
  })

  const assignment: LeadAssignment | undefined = data?.data[0]
  const totalLeads = data?.meta.total ?? 0

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

  // Poll assignment to detect active-call changes
  const { data: polledAssignment } = useLeadAssignment(assignment?.id, {
    refetchInterval: isPollingForCall ? 2000 : false,
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
    }
  }, [isPollingForCall, callWasActive, polledAssignment])

  // -------------------------------------------------------------------------
  // Update assignment mutation
  // -------------------------------------------------------------------------
  const { mutate: updateAssignment, isPending: isSaving } =
    useUpdateLeadAssignment()

  // -------------------------------------------------------------------------
  // Reset outcome when navigating leads
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (assignment) {
      setOutcomeStatus(assignment.status ?? '')
      setOutcomeLastCallStatus(assignment.lastCallStatus ?? '')
      setOutcomeNotes(assignment.leadProgressNotes ?? '')
    } else {
      setOutcomeStatus('')
      setOutcomeLastCallStatus('')
      setOutcomeNotes('')
    }
  }, [currentIndex, assignment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Reset index when filter changes
  // -------------------------------------------------------------------------
  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentIndex(1)
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
          lastCallStatus:
            outcomeLastCallStatus !== ''
              ? (outcomeLastCallStatus as LastCallStatus)
              : null,
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
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('workMode.filterAll', 'All')}</SelectItem>
              <SelectItem value={LeadStatus.NEW}>{t('leads.status.new', 'New')}</SelectItem>
              <SelectItem value={LeadStatus.ATTEMPTED}>{t('leads.status.attempted', 'Attempted')}</SelectItem>
              <SelectItem value={LeadStatus.HOT}>{t('leads.status.hot', 'Hot')}</SelectItem>
              <SelectItem value={LeadStatus.WARM}>{t('leads.status.warm', 'Warm')}</SelectItem>
              <SelectItem value={LeadStatus.COLD}>{t('leads.status.cold', 'Cold')}</SelectItem>
              <SelectItem value={LeadStatus.CLOSED}>{t('leads.status.closed', 'Closed')}</SelectItem>
              <SelectItem value={LeadStatus.MISSED}>{t('leads.status.missed', 'Missed')}</SelectItem>
            </SelectContent>
          </Select>
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
      {/* ------------------------------------------------------------------ */}
      {/* Header bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 1}
            onClick={() => setCurrentIndex((i) => Math.max(1, i - 1))}
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
            onClick={() => setCurrentIndex((i) => Math.min(totalLeads, i + 1))}
            className="gap-1"
          >
            {t('workMode.next', 'Next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('workMode.filterAll', 'All')}</SelectItem>
            <SelectItem value={LeadStatus.NEW}>{t('leads.status.new', 'New')}</SelectItem>
            <SelectItem value={LeadStatus.ATTEMPTED}>{t('leads.status.attempted', 'Attempted')}</SelectItem>
            <SelectItem value={LeadStatus.HOT}>{t('leads.status.hot', 'Hot')}</SelectItem>
            <SelectItem value={LeadStatus.WARM}>{t('leads.status.warm', 'Warm')}</SelectItem>
            <SelectItem value={LeadStatus.COLD}>{t('leads.status.cold', 'Cold')}</SelectItem>
            <SelectItem value={LeadStatus.CLOSED}>{t('leads.status.closed', 'Closed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Left column — Lead information                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('leads.sections.basicInfo', 'Basic Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label={t('leads.name', 'Name')}>
                  {lead?.leadName || '-'}
                </InfoRow>

                <InfoRow label={t('leads.phone', 'Phone')}>
                  <span className="inline-flex items-center gap-1">
                    {lead?.phone || '-'}
                    {lead?.phone && (
                      <WhatsAppStatusIcon hasWhatsapp={lead.hasWhatsapp} />
                    )}
                  </span>
                </InfoRow>

                <InfoRow label={t('leads.email', 'Email')}>
                  {lead?.email || '-'}
                </InfoRow>

                <InfoRow label={t('leads.gender', 'Gender')}>
                  {lead?.gender || '-'}
                </InfoRow>

                <InfoRow label={t('leads.dateOfBirth', 'Date of Birth')}>
                  {formatDateOnly(lead?.dateOfBirth)}
                </InfoRow>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('leads.sections.address', 'Address Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label={t('leads.address', 'Address')}>
                  {lead?.address || '-'}
                </InfoRow>

                <InfoRow label={t('leads.city', 'City')}>
                  {lead?.city || '-'}
                </InfoRow>

                <InfoRow label={t('leads.province', 'Province')}>
                  {lead?.province || '-'}
                </InfoRow>

                <InfoRow label={t('leads.postalCode', 'Postal Code')}>
                  {lead?.postalCode || '-'}
                </InfoRow>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('leads.sections.work', 'Work Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label={t('leads.occupation', 'Occupation')}>
                  {lead?.occupation || '-'}
                </InfoRow>

                <InfoRow label={t('leads.jobTitle', 'Job Title')}>
                  {lead?.jobTitle || '-'}
                </InfoRow>

                <InfoRow label={t('leads.companyName', 'Company')}>
                  {lead?.companyName || '-'}
                </InfoRow>

                <InfoRow label={t('leads.officeAddress', 'Office Address')}>
                  {lead?.officeAddress || '-'}
                </InfoRow>

                <InfoRow label={t('leads.salaryRange', 'Salary Range')}>
                  {lead?.salaryMin != null || lead?.salaryMax != null
                    ? `${lead?.salaryMin ?? '-'} – ${lead?.salaryMax ?? '-'}`
                    : '-'}
                </InfoRow>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('leads.sections.additional', 'Additional Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <InfoRow label={t('leads.tags', 'Tags')}>
                  {lead?.tags || '-'}
                </InfoRow>

                <InfoRow label={t('leads.notes', 'Notes')}>
                  {lead?.notes || '-'}
                </InfoRow>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t('leads.customFields', 'Custom Fields')}
                  </span>
                  {lead?.customFields &&
                  Object.keys(lead.customFields).length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {Object.entries(lead.customFields).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="font-medium min-w-0 shrink-0">
                            {key}:
                          </span>
                          <span className="text-muted-foreground break-words">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-medium">
                      {t('leads.customFieldsNone', 'None')}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
            </CardContent>
          </Card>

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
                  {t('leads.status', 'Status')}
                </label>
                <Select
                  value={outcomeStatus}
                  onValueChange={(v) => setOutcomeStatus(v as LeadStatus)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('workMode.selectStatus', 'Select status')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LeadStatus.NEW}>
                      {t('leads.status.new', 'New')}
                    </SelectItem>
                    <SelectItem value={LeadStatus.ATTEMPTED}>
                      {t('leads.status.attempted', 'Attempted')}
                    </SelectItem>
                    <SelectItem value={LeadStatus.HOT}>
                      {t('leads.status.hot', 'Hot')}
                    </SelectItem>
                    <SelectItem value={LeadStatus.WARM}>
                      {t('leads.status.warm', 'Warm')}
                    </SelectItem>
                    <SelectItem value={LeadStatus.COLD}>
                      {t('leads.status.cold', 'Cold')}
                    </SelectItem>
                    <SelectItem value={LeadStatus.CLOSED}>
                      {t('leads.status.closed', 'Closed')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Call Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {t('leads.lastCallStatus', 'Last Call Status')}
                </label>
                <Select
                  value={outcomeLastCallStatus}
                  onValueChange={(v) =>
                    setOutcomeLastCallStatus(v as LastCallStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'workMode.selectLastCallStatus',
                        'Select call status',
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LastCallStatus.ANSWERED}>
                      {t('leads.lastCallStatus.answered', 'Answered')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.NO_ANSWER}>
                      {t('leads.lastCallStatus.noAnswer', 'No Answer')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.BUSY}>
                      {t('leads.lastCallStatus.busy', 'Busy')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.VOICEMAIL}>
                      {t('leads.lastCallStatus.voicemail', 'Voicemail')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.WRONG_NUMBER}>
                      {t('leads.lastCallStatus.wrongNumber', 'Wrong Number')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.CALLBACK_REQUESTED}>
                      {t(
                        'leads.lastCallStatus.callbackRequested',
                        'Callback Requested',
                      )}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.NOT_INTERESTED}>
                      {t('leads.lastCallStatus.notInterested', 'Not Interested')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.INTERESTED}>
                      {t('leads.lastCallStatus.interested', 'Interested')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.DISCONNECTED}>
                      {t('leads.lastCallStatus.disconnected', 'Disconnected')}
                    </SelectItem>
                    <SelectItem value={LastCallStatus.INVALID_NUMBER}>
                      {t('leads.lastCallStatus.invalidNumber', 'Invalid Number')}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('common.createdAt', 'Created')}
                </span>
                <span>{formatDate(assignment?.createdAt)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('common.updatedAt', 'Updated')}
                </span>
                <span>{formatDate(assignment?.updatedAt)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.lastContacted', 'Last Contacted')}
                </span>
                <span>{formatDate(assignment?.lastContactedAt)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.followupCount', 'Followup Count')}
                </span>
                <span>{assignment?.followupCount ?? 0}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('leads.nextFollowUp', 'Next Follow-up')}
                </span>
                <span>{formatDate(assignment?.nextFollowUpAt)}</span>
              </div>
            </CardContent>
          </Card>
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
    </div>
  )
}
