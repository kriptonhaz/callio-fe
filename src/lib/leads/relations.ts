// Predefined emergency-contact relations. Backend stores `relation` as a
// free-text string, but the frontend constrains the user to this dropdown plus
// an "Other" escape hatch (which submits the user-typed string instead).
export const RELATION_SLUGS = [
  'father',
  'mother',
  'spouse',
  'sibling',
  'child',
  'friend',
] as const

export type RelationSlug = (typeof RELATION_SLUGS)[number]

export const OTHER_RELATION = 'other'

const KNOWN_SET = new Set<string>(RELATION_SLUGS)

// Returns true when the given string matches one of the known relation slugs
// (case-insensitive).
export function isKnownRelation(value: string | null | undefined): boolean {
  if (!value) return false
  return KNOWN_SET.has(value.trim().toLowerCase())
}

export const MAX_EMERGENCY_CONTACTS = 5
