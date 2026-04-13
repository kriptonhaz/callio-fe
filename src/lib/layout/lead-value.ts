import type { Lead } from '@/lib/api/types/leads.types'
import { CUSTOM_PREFIX, isCustomKey, customKeyName } from './field-registry'

export type LeadFormValues = Record<string, unknown> & {
  customFields?: Record<string, string> | null
}

export function getLeadValue(values: LeadFormValues, key: string): unknown {
  if (isCustomKey(key)) {
    const name = customKeyName(key)
    return values.customFields?.[name] ?? ''
  }
  return (values as Record<string, unknown>)[key] ?? ''
}

export function setLeadValue(
  values: LeadFormValues,
  key: string,
  value: unknown,
): LeadFormValues {
  if (isCustomKey(key)) {
    const name = customKeyName(key)
    const next: Record<string, string> = { ...(values.customFields ?? {}) }
    if (value === '' || value == null) {
      delete next[name]
    } else {
      next[name] = String(value)
    }
    return {
      ...values,
      customFields: Object.keys(next).length > 0 ? next : null,
    }
  }
  return { ...values, [key]: value }
}

export function leadToFormValues(lead: Lead | null | undefined): LeadFormValues {
  if (!lead) return {}
  return {
    leadName: lead.leadName ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    gender: lead.gender ?? '',
    dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.split('T')[0] : '',
    address: lead.address ?? '',
    city: lead.city ?? '',
    province: lead.province ?? '',
    postalCode: lead.postalCode ?? '',
    occupation: lead.occupation ?? '',
    jobTitle: lead.jobTitle ?? '',
    companyName: lead.companyName ?? '',
    officeAddress: lead.officeAddress ?? '',
    salaryMin:
      lead.salaryMin !== null && lead.salaryMin !== undefined
        ? String(lead.salaryMin)
        : '',
    salaryMax:
      lead.salaryMax !== null && lead.salaryMax !== undefined
        ? String(lead.salaryMax)
        : '',
    tags: lead.tags ?? '',
    notes: lead.notes ?? '',
    customFields: (lead.customFields ?? null) as Record<string, string> | null,
  }
}

export { CUSTOM_PREFIX }
