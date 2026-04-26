import type { Lead } from '@/lib/api/types/leads.types'

// Single source of truth for the merge tags supported by email templates.
// The backend performs the actual substitution at send time. The frontend
// uses this list for two things:
//  1. The "Insert variable" popover in the editor.
//  2. Rendering a local preview before send.
//
// Pattern: single curly braces — matches BlastWhatsAppSheet and ComposeSmsSheet.
// Backend must recognize the same set.
export interface EmailTemplateVariable {
  key: string // including curly braces, e.g. "{leadName}"
  label: string
  // Source key on the Lead object. `firstName` is derived from leadName.
  source:
    | 'leadName'
    | 'firstName'
    | 'phone'
    | 'email'
    | 'city'
    | 'province'
    | 'companyName'
    | 'jobTitle'
    | 'occupation'
    | 'address'
}

export const EMAIL_TEMPLATE_VARIABLES: ReadonlyArray<EmailTemplateVariable> = [
  { key: '{leadName}', label: 'Lead name', source: 'leadName' },
  { key: '{firstName}', label: 'First name', source: 'firstName' },
  { key: '{phone}', label: 'Phone', source: 'phone' },
  { key: '{email}', label: 'Email', source: 'email' },
  { key: '{city}', label: 'City', source: 'city' },
  { key: '{province}', label: 'Province', source: 'province' },
  { key: '{companyName}', label: 'Company', source: 'companyName' },
  { key: '{jobTitle}', label: 'Job title', source: 'jobTitle' },
  { key: '{occupation}', label: 'Occupation', source: 'occupation' },
  { key: '{address}', label: 'Address', source: 'address' },
]

// Shape used by the local preview helper. Mostly Lead fields plus a few
// tweaks (the "sample" fallbacks below show how unset fields render).
export type PreviewLead = Pick<
  Lead,
  | 'leadName'
  | 'phone'
  | 'email'
  | 'city'
  | 'province'
  | 'companyName'
  | 'jobTitle'
  | 'occupation'
  | 'address'
  | 'customFields'
>

export const SAMPLE_PREVIEW_LEAD: PreviewLead = {
  leadName: 'Budi Santoso',
  phone: '+6281234567890',
  email: 'budi.santoso@example.com',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  companyName: 'PT. Sinar Cemerlang',
  jobTitle: 'Marketing Manager',
  occupation: 'Marketing',
  address: 'Jl. Sudirman No. 123',
  customFields: { billing: 'Rp 10.000' },
}

export function lookupVariable(
  source: EmailTemplateVariable['source'],
  lead: PreviewLead,
): string {
  switch (source) {
    case 'leadName':
      return lead.leadName ?? ''
    case 'firstName':
      return (lead.leadName ?? '').trim().split(/\s+/)[0] ?? ''
    case 'phone':
      return lead.phone ?? ''
    case 'email':
      return lead.email ?? ''
    case 'city':
      return lead.city ?? ''
    case 'province':
      return lead.province ?? ''
    case 'companyName':
      return lead.companyName ?? ''
    case 'jobTitle':
      return lead.jobTitle ?? ''
    case 'occupation':
      return lead.occupation ?? ''
    case 'address':
      return lead.address ?? ''
  }
}
