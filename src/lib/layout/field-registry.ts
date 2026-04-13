export type FieldInputType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'

export type DefaultSectionKey =
  | 'leadInfo'
  | 'address'
  | 'work'
  | 'additional'

export interface FieldMeta {
  key: string
  defaultLabel: string
  type: FieldInputType
  defaultSection: DefaultSectionKey
  defaultEditable: boolean
  options?: Array<{ value: string; label: string }>
  isCustom?: boolean
}

export const CUSTOM_PREFIX = 'customFields.'

export const FIELD_REGISTRY: Record<string, FieldMeta> = {
  leadName: {
    key: 'leadName',
    defaultLabel: 'Name',
    type: 'text',
    defaultSection: 'leadInfo',
    defaultEditable: true,
  },
  phone: {
    key: 'phone',
    defaultLabel: 'Phone',
    type: 'phone',
    defaultSection: 'leadInfo',
    defaultEditable: true,
  },
  email: {
    key: 'email',
    defaultLabel: 'Email',
    type: 'email',
    defaultSection: 'leadInfo',
    defaultEditable: true,
  },
  gender: {
    key: 'gender',
    defaultLabel: 'Gender',
    type: 'select',
    defaultSection: 'leadInfo',
    defaultEditable: true,
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  dateOfBirth: {
    key: 'dateOfBirth',
    defaultLabel: 'Date of Birth',
    type: 'date',
    defaultSection: 'leadInfo',
    defaultEditable: true,
  },
  address: {
    key: 'address',
    defaultLabel: 'Address',
    type: 'textarea',
    defaultSection: 'address',
    defaultEditable: true,
  },
  city: {
    key: 'city',
    defaultLabel: 'City',
    type: 'text',
    defaultSection: 'address',
    defaultEditable: true,
  },
  province: {
    key: 'province',
    defaultLabel: 'Province',
    type: 'text',
    defaultSection: 'address',
    defaultEditable: true,
  },
  postalCode: {
    key: 'postalCode',
    defaultLabel: 'Postal Code',
    type: 'text',
    defaultSection: 'address',
    defaultEditable: true,
  },
  occupation: {
    key: 'occupation',
    defaultLabel: 'Occupation',
    type: 'text',
    defaultSection: 'work',
    defaultEditable: true,
  },
  jobTitle: {
    key: 'jobTitle',
    defaultLabel: 'Job Title',
    type: 'text',
    defaultSection: 'work',
    defaultEditable: true,
  },
  companyName: {
    key: 'companyName',
    defaultLabel: 'Company',
    type: 'text',
    defaultSection: 'work',
    defaultEditable: true,
  },
  officeAddress: {
    key: 'officeAddress',
    defaultLabel: 'Office Address',
    type: 'textarea',
    defaultSection: 'work',
    defaultEditable: true,
  },
  salaryMin: {
    key: 'salaryMin',
    defaultLabel: 'Salary Min',
    type: 'number',
    defaultSection: 'work',
    defaultEditable: true,
  },
  salaryMax: {
    key: 'salaryMax',
    defaultLabel: 'Salary Max',
    type: 'number',
    defaultSection: 'work',
    defaultEditable: true,
  },
  tags: {
    key: 'tags',
    defaultLabel: 'Tags',
    type: 'text',
    defaultSection: 'additional',
    defaultEditable: true,
  },
  notes: {
    key: 'notes',
    defaultLabel: 'Notes',
    type: 'textarea',
    defaultSection: 'additional',
    defaultEditable: true,
  },
}

export const ALL_STANDARD_KEYS = Object.keys(FIELD_REGISTRY)

export function isCustomKey(key: string): boolean {
  return key.startsWith(CUSTOM_PREFIX)
}

export function customKeyName(key: string): string {
  return key.slice(CUSTOM_PREFIX.length)
}

export function buildCustomKey(name: string): string {
  return `${CUSTOM_PREFIX}${name}`
}

export function buildCustomFieldMeta(key: string): FieldMeta {
  return {
    key,
    defaultLabel: customKeyName(key),
    type: 'text',
    defaultSection: 'additional',
    defaultEditable: true,
    isCustom: true,
  }
}

export function resolveFieldMeta(key: string): FieldMeta | null {
  if (FIELD_REGISTRY[key]) return FIELD_REGISTRY[key]
  if (isCustomKey(key)) return buildCustomFieldMeta(key)
  return null
}
