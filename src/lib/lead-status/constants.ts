export const SYSTEM_SLUGS = {
  NEW: 'new',
  MISSED: 'missed',
} as const

export const ALL_FILTER_VALUE = 'all'

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64)
}

export function humanizeSlug(slug: string): string {
  return slug
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}
