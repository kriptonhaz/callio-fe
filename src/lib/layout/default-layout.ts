import type { LayoutSectionsJson } from '@/lib/api/types/layout-configs.types'

export const DEFAULT_LAYOUT_SCHEMA_VERSION = 1

export function buildDefaultLayout(): LayoutSectionsJson {
  return {
    schemaVersion: DEFAULT_LAYOUT_SCHEMA_VERSION,
    sections: [
      {
        id: 'sec-lead-info',
        title: 'Lead Info',
        order: 0,
        fields: [
          { key: 'leadName', label: 'Name', editable: true, order: 0 },
          { key: 'phone', label: 'Phone', editable: true, order: 1 },
          { key: 'email', label: 'Email', editable: true, order: 2 },
          { key: 'gender', label: 'Gender', editable: true, order: 3 },
          {
            key: 'dateOfBirth',
            label: 'Date of Birth',
            editable: true,
            order: 4,
          },
        ],
      },
      {
        id: 'sec-address',
        title: 'Address',
        order: 1,
        fields: [
          { key: 'address', label: 'Address', editable: true, order: 0 },
          { key: 'city', label: 'City', editable: true, order: 1 },
          { key: 'province', label: 'Province', editable: true, order: 2 },
          { key: 'postalCode', label: 'Postal Code', editable: true, order: 3 },
        ],
      },
      {
        id: 'sec-work',
        title: 'Work',
        order: 2,
        fields: [
          { key: 'occupation', label: 'Occupation', editable: true, order: 0 },
          { key: 'jobTitle', label: 'Job Title', editable: true, order: 1 },
          { key: 'companyName', label: 'Company', editable: true, order: 2 },
          {
            key: 'officeAddress',
            label: 'Office Address',
            editable: true,
            order: 3,
          },
          { key: 'salaryMin', label: 'Salary Min', editable: true, order: 4 },
          { key: 'salaryMax', label: 'Salary Max', editable: true, order: 5 },
        ],
      },
      {
        id: 'sec-additional',
        title: 'Additional',
        order: 3,
        fields: [
          { key: 'tags', label: 'Tags', editable: true, order: 0 },
          { key: 'notes', label: 'Notes', editable: true, order: 1 },
        ],
      },
    ],
  }
}

/**
 * Returns all field keys currently placed in a layout.
 */
export function getPlacedKeys(layout: LayoutSectionsJson): Set<string> {
  const out = new Set<string>()
  for (const sec of layout.sections) {
    for (const f of sec.fields) out.add(f.key)
  }
  return out
}

/**
 * For Work Mode runtime rendering only: appends discovered custom-field keys
 * that aren't in the saved layout into the last section so agents don't lose
 * visibility. Does NOT mutate persisted config.
 */
export function mergeDiscoveredCustomKeys(
  layout: LayoutSectionsJson,
  customKeys: string[],
): LayoutSectionsJson {
  if (customKeys.length === 0) return layout
  const placed = getPlacedKeys(layout)
  const missing = customKeys.filter((k) => !placed.has(`customFields.${k}`))
  if (missing.length === 0) return layout

  const sections = [...layout.sections].sort((a, b) => a.order - b.order)
  if (sections.length === 0) return layout

  const target = sections[sections.length - 1]
  const baseOrder = target.fields.length
  const extraFields = missing.map((name, idx) => ({
    key: `customFields.${name}`,
    label: name,
    editable: true,
    order: baseOrder + idx,
  }))

  return {
    ...layout,
    sections: sections.map((s, i) =>
      i === sections.length - 1
        ? { ...s, fields: [...s.fields, ...extraFields] }
        : s,
    ),
  }
}

export function sortLayout(layout: LayoutSectionsJson): LayoutSectionsJson {
  return {
    ...layout,
    sections: [...layout.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        ...s,
        fields: [...s.fields].sort((a, b) => a.order - b.order),
      })),
  }
}
