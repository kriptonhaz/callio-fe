import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react'
import { EmergencyContactsField } from './EmergencyContactsField'
import type {
  CreateLeadRequest,
  EmergencyContact,
} from '@/lib/api/types/leads.types'
import { useCreateLead } from '@/hooks/api/useLeads'
import {
  MAX_EMERGENCY_CONTACTS,
  OTHER_RELATION,
  RELATION_SLUGS,
} from '@/lib/leads/relations'
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

interface CustomField {
  label: string
  value: string
}

const emergencyContactRowSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    relation: z
      .string()
      .min(1, 'Please select a relation')
      .refine(
        (v) =>
          (RELATION_SLUGS as ReadonlyArray<string>).includes(v) ||
          v === OTHER_RELATION,
        'Please select a relation',
      ),
    relationOther: z.string().optional(),
  })
  .refine(
    (d) => d.relation !== OTHER_RELATION || (d.relationOther ?? '').trim() !== '',
    {
      path: ['relationOther'],
      message: 'Please specify the relationship',
    },
  )

const leadFormSchema = z.object({
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
  emergencyContacts: z
    .array(emergencyContactRowSchema)
    .max(MAX_EMERGENCY_CONTACTS)
    .optional(),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface AddLeadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  campaignId: string
  onSuccess?: () => void
}

export function AddLeadSheet({
  open,
  onOpenChange,
  clientId,
  campaignId,
  onSuccess,
}: AddLeadSheetProps) {
  const { t } = useTranslation()
  const { mutate: createLead, isPending } = useCreateLead()

  const [addressOpen, setAddressOpen] = useState(false)
  const [workOpen, setWorkOpen] = useState(false)
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const [customFields, setCustomFields] = useState<Array<CustomField>>([])

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
      emergencyContacts: [],
    },
  })

  const handleClose = () => {
    form.reset()
    setAddressOpen(false)
    setWorkOpen(false)
    setAdditionalOpen(false)
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
    // Build customFields object from array
    const customFieldsObj: Record<string, string> = {}
    customFields.forEach((cf) => {
      if (cf.label.trim() && cf.value.trim()) {
        customFieldsObj[cf.label.trim()] = cf.value.trim()
      }
    })

    const payload: CreateLeadRequest = {
      clientId,
      campaignIds: campaignId ? [campaignId] : [],
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
      customFields:
        Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null,
      emergencyContacts: (() => {
        const rows = (data.emergencyContacts ?? []).map<EmergencyContact>(
          (r) => ({
            name: r.name.trim(),
            phone: r.phone.trim(),
            relation:
              r.relation === OTHER_RELATION
                ? (r.relationOther ?? '').trim()
                : r.relation,
          }),
        )
        return rows.length > 0 ? rows : null
      })(),
      tags: data.tags || null,
      notes: data.notes || null,
    }

    createLead(payload, {
      onSuccess: () => {
        toast.success(t('leads.created', 'Lead created successfully'))
        handleClose()
        onSuccess?.()
      },
      onError: () => {
        toast.error(t('leads.createFailed', 'Failed to create lead'))
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">
            {t('leads.addLead', 'Add Lead')}
          </SheetTitle>
          <SheetDescription>
            {t('leads.addDescription', 'Add a new lead to this campaign.')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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

                {/* Emergency Contacts Section */}
                <EmergencyContactsField
                  control={form.control}
                  name="emergencyContacts"
                />
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.create', 'Create')}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
