import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useUpdateLead } from '@/hooks/api/useLeads'
import { useUpdateLeadAssignment } from '@/hooks/api/useLeadAssignments'
import { useUsers } from '@/hooks/api/useUsers'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useSipCredentials } from '@/hooks/api/useSipExtensions'
import { useInitiateCallSession, useDialRecording } from '@/hooks/api/useCalls'
import { useMe } from '@/hooks/api/useAuth'
import { useSipStore } from '@/store/useSipStore'
import { LeadStatus, UserRole } from '@/lib/api/types'
import { ServiceType } from '@/lib/api/types/services.types'
import { LastCallStatus } from '@/lib/api/types/lead-assignments.types'
import type { LeadAssignment } from '@/lib/api/types/lead-assignments.types'
import type { UpdateLeadRequest } from '@/lib/api/types/leads.types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ChevronDown,
  Phone,
  PhoneOff,
  Plus,
  Trash2,
  Music,
  Mic,
} from 'lucide-react'
import { format } from 'date-fns'
import { VoiceRecordingsDialog } from './VoiceRecordingsDialog'
import type { VoiceRecording } from '@/hooks/api/useVoiceRecordings'

interface CustomField {
  label: string
  value: string
}

const leadFormSchema = z.object({
  // Lead fields
  leadName: z.string().min(2, 'leads.validation.nameMin'),
  phone: z.string().min(8, 'leads.validation.phoneMin'),
  email: z
    .string()
    .email('leads.validation.emailInvalid')
    .optional()
    .or(z.literal('')),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  occupation: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  officeAddress: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  // Assignment fields
  status: z.nativeEnum(LeadStatus),
  assignedSupervisorId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  lastCallStatus: z.nativeEnum(LastCallStatus).optional(),
  leadProgressNotes: z.string().optional(),
  followupCount: z.string().optional(),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface EditLeadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: LeadAssignment | null
  clientId: string
  campaignId: string
  onSuccess?: () => void
  showAssignment?: boolean // Optional prop to show/hide assignment section
  campaignServices?: { serviceType: string }[] // Campaign services to check VoIP availability
}

export function EditLeadSheet({
  open,
  onOpenChange,
  assignment,
  clientId,
  campaignId,
  onSuccess,
  showAssignment = true, // Default to true for backward compatibility
  campaignServices,
}: EditLeadSheetProps) {
  const { t } = useTranslation()
  const { mutate: updateLead, isPending: isUpdatingLead } = useUpdateLead()
  const { mutate: updateAssignment, isPending: isUpdatingAssignment } =
    useUpdateLeadAssignment()
  const { data: currentUser } = useMe()
  const { mutate: initiateSession, isPending: isInitiatingSession } =
    useInitiateCallSession()
  const makeCall = useSipStore((state) => state.makeCall)
  const hangup = useSipStore((state) => state.hangup)
  const callStatus = useSipStore((state) => state.callStatus)
  const sipmlReady = useSipStore((state) => state.sipmlReady)
  const isDialing =
    callStatus === 'calling' ||
    callStatus === 'connecting' ||
    isInitiatingSession
  const isCallActive =
    callStatus === 'active' ||
    callStatus === 'ringing' ||
    callStatus === 'connecting' ||
    callStatus === 'calling'

  const [addressOpen, setAddressOpen] = useState(false)
  const [workOpen, setWorkOpen] = useState(false)
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(true)
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  // Voice recording call mode state
  const [callMode, setCallMode] = useState<'live' | 'recording'>('live')
  const [selectedRecording, setSelectedRecording] =
    useState<VoiceRecording | null>(null)
  const [showRecordingsDialog, setShowRecordingsDialog] = useState(false)
  const { mutate: dialRecording, isPending: isDialingRecording } =
    useDialRecording()

  const isPending = isUpdatingLead || isUpdatingAssignment

  // Fetch supervisors and agents
  const { data: supervisorsData } = useUsers(
    { role: UserRole.SUPERVISOR, clientId, limit: 100 },
    !!clientId,
  )
  const { data: agentsData } = useUsers(
    { role: UserRole.AGENT, clientId, limit: 100 },
    !!clientId,
  )

  const supervisors = supervisorsData?.data || []
  const agents = agentsData?.data || []

  // Check VoIP service and user SIP credentials
  const { data: enabledServices } = useEnabledServices(clientId)
  const { data: sipCredentials } = useSipCredentials()
  const isRegistered = useSipStore((state) => state.status === 'registered')

  // Check if client has VoIP service enabled
  const isVoipEnabled = enabledServices?.some(
    (service) => service.serviceType === ServiceType.VOICE,
  )

  // Check if campaign has VoIP service
  const campaignHasVoipService =
    campaignServices?.some((s) => s.serviceType === ServiceType.VOICE) ?? false

  const userHasSipExtension = !!sipCredentials

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      leadName: '',
      phone: '',
      email: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      occupation: '',
      jobTitle: '',
      companyName: '',
      officeAddress: '',
      salaryMin: '',
      salaryMax: '',
      tags: '',
      notes: '',
      status: LeadStatus.NEW,
      assignedSupervisorId: '',
      assignedAgentId: '',
      lastCallStatus: undefined,
      leadProgressNotes: '',
      followupCount: '',
    },
  })

  // Populate form when assignment changes
  useEffect(() => {
    if (assignment?.lead) {
      const lead = assignment.lead
      form.reset({
        leadName: lead.leadName || '',
        phone: lead.phone || '',
        email: lead.email || '',
        gender: lead.gender || '',
        dateOfBirth: lead.dateOfBirth || '',
        address: lead.address || '',
        city: lead.city || '',
        province: lead.province || '',
        postalCode: lead.postalCode || '',
        occupation: lead.occupation || '',
        jobTitle: lead.jobTitle || '',
        companyName: lead.companyName || '',
        officeAddress: lead.officeAddress || '',
        salaryMin: lead.salaryMin?.toString() || '',
        salaryMax: lead.salaryMax?.toString() || '',
        tags: lead.tags || '',
        notes: lead.notes || '',
        status: assignment.status || LeadStatus.NEW,
        assignedSupervisorId: assignment.assignedSupervisorId || '',
        assignedAgentId: assignment.assignedAgentId || '',
        lastCallStatus: assignment.lastCallStatus || undefined,
        leadProgressNotes: assignment.leadProgressNotes || '',
        followupCount: assignment.followupCount?.toString() || '',
      })

      // Populate custom fields from lead
      if (lead.customFields && typeof lead.customFields === 'object') {
        const cfArray = Object.entries(lead.customFields).map(
          ([label, value]) => ({
            label,
            value: String(value),
          }),
        )
        setCustomFields(cfArray)
      } else {
        setCustomFields([])
      }
    }
  }, [assignment, form])

  const handleClose = () => {
    form.reset()
    setAddressOpen(false)
    setWorkOpen(false)
    setAdditionalOpen(false)
    setAssignmentOpen(true)
    setCustomFields([])
    onOpenChange(false)
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }])
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (
    index: number,
    field: 'label' | 'value',
    value: string,
  ) => {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }

  const onSubmit = (data: LeadFormValues) => {
    if (!assignment?.lead?.id) return

    // Update lead
    const leadPayload: UpdateLeadRequest = {
      leadName: data.leadName,
      phone: data.phone,
      email: data.email || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      postalCode: data.postalCode || null,
      occupation: data.occupation || null,
      jobTitle: data.jobTitle || null,
      companyName: data.companyName || null,
      officeAddress: data.officeAddress || null,
      salaryMin: data.salaryMin ? parseInt(data.salaryMin, 10) : null,
      salaryMax: data.salaryMax ? parseInt(data.salaryMax, 10) : null,
      customFields: (() => {
        const obj: Record<string, string> = {}
        customFields.forEach((cf) => {
          if (cf.label.trim() && cf.value.trim()) {
            obj[cf.label.trim()] = cf.value.trim()
          }
        })
        return Object.keys(obj).length > 0 ? obj : null
      })(),
      tags: data.tags || null,
      notes: data.notes || null,
    }

    // Only update assignment if there's a campaign context
    const hasAssignment = !!assignment.id && !!campaignId

    if (hasAssignment) {
      // Update assignment
      const assignmentPayload = {
        leadId: assignment.lead.id,
        clientId,
        campaignId,
        assignedSupervisorId: data.assignedSupervisorId || null,
        assignedAgentId: data.assignedAgentId || null,
        status: data.status,
        lastCallStatus: data.lastCallStatus || null,
        leadProgressNotes: data.leadProgressNotes || null,
        followupCount: data.followupCount
          ? parseInt(data.followupCount, 10)
          : null,
      }

      // Call both APIs when there's an assignment
      updateLead(
        { id: assignment.lead.id, data: leadPayload },
        {
          onSuccess: () => {
            updateAssignment(
              { id: assignment.id, data: assignmentPayload },
              {
                onSuccess: () => {
                  toast.success(t('leads.updated', 'Lead updated successfully'))
                  handleClose()
                  onSuccess?.()
                },
                onError: () => {
                  toast.error(
                    t('leads.updateFailed', 'Failed to update lead assignment'),
                  )
                },
              },
            )
          },
          onError: () => {
            toast.error(t('leads.updateFailed', 'Failed to update lead'))
          },
        },
      )
    } else {
      // Only update lead when there's no assignment
      updateLead(
        { id: assignment.lead.id, data: leadPayload },
        {
          onSuccess: () => {
            toast.success(t('leads.updated', 'Lead updated successfully'))
            handleClose()
            onSuccess?.()
          },
          onError: () => {
            toast.error(t('leads.updateFailed', 'Failed to update lead'))
          },
        },
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">
            {t('leads.editLead', 'Edit Lead')}
          </SheetTitle>
          <SheetDescription>
            {t('leads.editDescription', 'Update lead and assignment details.')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Assignment Section - Only show in campaign context */}
              {showAssignment && (
                <Collapsible
                  open={assignmentOpen}
                  onOpenChange={setAssignmentOpen}
                >
                  <div className="border rounded-lg overflow-hidden border-primary/20 bg-primary/5">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors"
                      >
                        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                          {t('leads.assignmentInfo', 'Assignment Information')}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-primary transition-transform duration-200 ${
                            assignmentOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4 border-t border-primary/20">
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t('common.status', 'Status')}{' '}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastCallStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t(
                                    'leads.lastCallStatus',
                                    'Last Call Status',
                                  )}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ''}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue
                                        placeholder={t(
                                          'common.select',
                                          'Select',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={LastCallStatus.ANSWERED}>
                                      {t(
                                        'leads.callStatus.answered',
                                        'Answered',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.NO_ANSWER}
                                    >
                                      {t(
                                        'leads.callStatus.noAnswer',
                                        'No Answer',
                                      )}
                                    </SelectItem>
                                    <SelectItem value={LastCallStatus.BUSY}>
                                      {t('leads.callStatus.busy', 'Busy')}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.VOICEMAIL}
                                    >
                                      {t(
                                        'leads.callStatus.voicemail',
                                        'Voicemail',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.WRONG_NUMBER}
                                    >
                                      {t(
                                        'leads.callStatus.wrongNumber',
                                        'Wrong Number',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.CALLBACK_REQUESTED}
                                    >
                                      {t(
                                        'leads.callStatus.callbackRequested',
                                        'Callback Requested',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.NOT_INTERESTED}
                                    >
                                      {t(
                                        'leads.callStatus.notInterested',
                                        'Not Interested',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.INTERESTED}
                                    >
                                      {t(
                                        'leads.callStatus.interested',
                                        'Interested',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.DISCONNECTED}
                                    >
                                      {t(
                                        'leads.callStatus.disconnected',
                                        'Disconnected',
                                      )}
                                    </SelectItem>
                                    <SelectItem
                                      value={LastCallStatus.INVALID_NUMBER}
                                    >
                                      {t(
                                        'leads.callStatus.invalidNumber',
                                        'Invalid Number',
                                      )}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="assignedSupervisorId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t('leads.assignedSupervisor', 'Supervisor')}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ''}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue
                                        placeholder={t(
                                          'common.select',
                                          'Select',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {supervisors.map((supervisor) => (
                                      <SelectItem
                                        key={supervisor.id}
                                        value={supervisor.id}
                                      >
                                        {supervisor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="assignedAgentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t('leads.assignedAgent', 'Agent')}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ''}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue
                                        placeholder={t(
                                          'common.select',
                                          'Select',
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {agents.map((agent) => (
                                      <SelectItem
                                        key={agent.id}
                                        value={agent.id}
                                      >
                                        {agent.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="followupCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.followupCount', 'Followup Count')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  className="h-11 bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="leadProgressNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.progressNotes', 'Progress Notes')}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t(
                                    'leads.progressNotesPlaceholder',
                                    'Follow up notes...',
                                  )}
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                  {t('leads.basicInfo', 'Basic Information')}
                </h3>

                <FormField
                  control={form.control}
                  name="leadName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('leads.name', 'Name')}{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('leads.namePlaceholder', 'John Doe')}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('leads.phone', 'Phone')}{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+62812345678"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leads.email', 'Email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('leads.gender', 'Gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue
                                placeholder={t(
                                  'leads.selectGender',
                                  'Select gender',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">
                              {t('leads.male', 'Male')}
                            </SelectItem>
                            <SelectItem value="female">
                              {t('leads.female', 'Female')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('leads.dateOfBirth', 'Date of Birth')}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Section - Collapsible Card */}
              <Collapsible open={addressOpen} onOpenChange={setAddressOpen}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {t('leads.addressInfo', 'Address Information')}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                          addressOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t">
                      <div className="pt-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.address', 'Address')}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t(
                                    'leads.addressPlaceholder',
                                    'Street address',
                                  )}
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('leads.city', 'City')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'leads.cityPlaceholder',
                                    'Jakarta',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.province', 'Province')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'leads.provincePlaceholder',
                                    'DKI Jakarta',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('leads.postalCode', 'Postal Code')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'leads.postalCodePlaceholder',
                                  '12345',
                                )}
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Work Info Section - Collapsible Card */}
              <Collapsible open={workOpen} onOpenChange={setWorkOpen}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {t('leads.workInfo', 'Work Information')}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                          workOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t">
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <FormField
                          control={form.control}
                          name="occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.occupation', 'Occupation')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'leads.occupationPlaceholder',
                                    'Software Engineer',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="jobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.jobTitle', 'Job Title')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'leads.jobTitlePlaceholder',
                                    'Senior Developer',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('leads.companyName', 'Company Name')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'leads.companyNamePlaceholder',
                                  'PT. Tech Company',
                                )}
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="officeAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('leads.officeAddress', 'Office Address')}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t(
                                  'leads.officeAddressPlaceholder',
                                  'Office address',
                                )}
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="salaryMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.salaryMin', 'Salary Min')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t(
                                    'leads.salaryMinPlaceholder',
                                    '5000000',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salaryMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('leads.salaryMax', 'Salary Max')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t(
                                    'leads.salaryMaxPlaceholder',
                                    '10000000',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Additional Section - Collapsible Card */}
              <Collapsible
                open={additionalOpen}
                onOpenChange={setAdditionalOpen}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {t('leads.additionalInfo', 'Additional Information')}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                          additionalOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t">
                      <div className="pt-4">
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('leads.tags', 'Tags')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    'leads.tagsPlaceholder',
                                    'vip, enterprise',
                                  )}
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('leads.notes', 'Notes')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t(
                                  'leads.notesPlaceholder',
                                  'Additional notes',
                                )}
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Custom Fields Section */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">
                            {t('leads.customFields', 'Custom Fields')}
                          </FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomField}
                            className="h-8 gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            {t('leads.addField', 'Add Field')}
                          </Button>
                        </div>

                        {customFields.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t(
                              'leads.noCustomFields',
                              'No custom fields added yet.',
                            )}
                          </p>
                        )}

                        {customFields.map((cf, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              placeholder={t('leads.fieldLabel', 'Label')}
                              value={cf.label}
                              onChange={(e) =>
                                updateCustomField(
                                  index,
                                  'label',
                                  e.target.value,
                                )
                              }
                              className="h-10 flex-1"
                            />
                            <Input
                              placeholder={t('leads.fieldValue', 'Value')}
                              value={cf.value}
                              onChange={(e) =>
                                updateCustomField(
                                  index,
                                  'value',
                                  e.target.value,
                                )
                              }
                              className="h-10 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomField(index)}
                              className="h-10 w-10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Internal Metadata - Read Only */}
              <div className="pt-4 border-t space-y-2">
                {assignment?.createdAt && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('common.createdAt', 'Created At')}:</span>
                    <span>
                      {(() => {
                        try {
                          return format(
                            new Date(assignment.createdAt),
                            'dd MMM yyyy HH:mm',
                          )
                        } catch {
                          return assignment.createdAt
                        }
                      })()}
                    </span>
                  </div>
                )}
                {assignment?.updatedAt && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('common.updatedAt', 'Updated At')}:</span>
                    <span>
                      {(() => {
                        try {
                          return format(
                            new Date(assignment.updatedAt),
                            'dd MMM yyyy HH:mm',
                          )
                        } catch {
                          return assignment.updatedAt
                        }
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with call button on left, save/cancel on right */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-background">
              {/* Call section on the left */}
              <div>
                {isVoipEnabled &&
                  campaignHasVoipService &&
                  userHasSipExtension &&
                  assignment?.lead?.phone && (
                    <div className="flex items-center gap-2">
                      {isCallActive ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => hangup()}
                        >
                          <PhoneOff className="h-4 w-4" />
                          {t('leads.hangup', 'Hang Up')}
                        </Button>
                      ) : (
                        <>
                          {/* Call Mode Toggle */}
                          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                            <Button
                              type="button"
                              variant={
                                callMode === 'live' ? 'default' : 'ghost'
                              }
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => {
                                setCallMode('live')
                                setSelectedRecording(null)
                              }}
                            >
                              <Mic className="h-3.5 w-3.5" />
                              {t('leads.liveVoice', 'Live')}
                            </Button>
                            <Button
                              type="button"
                              variant={
                                callMode === 'recording' ? 'default' : 'ghost'
                              }
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => setShowRecordingsDialog(true)}
                            >
                              <Music className="h-3.5 w-3.5" />
                              {selectedRecording
                                ? selectedRecording.name.substring(0, 10) +
                                  (selectedRecording.name.length > 10
                                    ? '...'
                                    : '')
                                : t('leads.recording', 'Recording')}
                            </Button>
                          </div>

                          {/* Call Button */}
                          <Button
                            type="button"
                            variant="default"
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            disabled={
                              callMode === 'live'
                                ? !isRegistered ||
                                  !sipmlReady ||
                                  isInitiatingSession ||
                                  !currentUser
                                : !selectedRecording || isDialingRecording
                            }
                            title={
                              callMode === 'live' && !isRegistered
                                ? t(
                                    'leads.connectToSipFirst',
                                    'Please connect to SIP first',
                                  )
                                : callMode === 'recording' && !selectedRecording
                                  ? t(
                                      'leads.selectRecording',
                                      'Please select a recording',
                                    )
                                  : undefined
                            }
                            onClick={() => {
                              if (!assignment?.lead?.phone) return

                              // Normalize phone number
                              let dialNumber = assignment.lead.phone
                              if (dialNumber.startsWith('+62')) {
                                dialNumber = '0' + dialNumber.slice(3)
                              } else if (dialNumber.startsWith('62')) {
                                dialNumber = '0' + dialNumber.slice(2)
                              }

                              if (
                                callMode === 'recording' &&
                                selectedRecording &&
                                assignment?.lead?.id
                              ) {
                                // Dial with recording
                                dialRecording(
                                  {
                                    destinationNumber: dialNumber,
                                    voiceRecordingId: selectedRecording.id,
                                    leadId: assignment.lead.id,
                                    campaignId,
                                  },
                                  {
                                    onSuccess: () => {
                                      toast.success(
                                        t(
                                          'leads.callInitiated',
                                          'Call initiated with recording',
                                        ),
                                      )
                                    },
                                    onError: (error) => {
                                      toast.error(
                                        error.message ||
                                          t(
                                            'leads.callFailed',
                                            'Failed to initiate call',
                                          ),
                                      )
                                    },
                                  },
                                )
                              } else if (
                                callMode === 'live' &&
                                assignment?.lead?.id &&
                                sipCredentials &&
                                currentUser?.id
                              ) {
                                // Live voice call - initiate session first
                                initiateSession(
                                  {
                                    campaignId,
                                    leadId: assignment.lead.id,
                                    phoneNumber: assignment.lead.phone,
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
                                    onError: (error) => {
                                      toast.error(
                                        t(
                                          'leads.sessionInitFailed',
                                          'Failed to initiate call session',
                                        ),
                                      )
                                      console.error(
                                        'Failed to initiate call session:',
                                        error,
                                      )
                                    },
                                  },
                                )
                              }
                            }}
                          >
                            {isDialing || isDialingRecording ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                            {t('leads.call', 'Call')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
              </div>

              {/* Voice Recordings Dialog */}
              <VoiceRecordingsDialog
                open={showRecordingsDialog}
                onOpenChange={setShowRecordingsDialog}
                selectedRecordingId={selectedRecording?.id}
                onSelect={(recording) => {
                  setSelectedRecording(recording)
                  if (recording) {
                    setCallMode('recording')
                  } else {
                    setCallMode('live')
                  }
                }}
              />

              {/* Save and Cancel buttons on the right */}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('common.save', 'Save')}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
