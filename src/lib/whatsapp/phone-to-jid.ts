export const phoneToJid = (
  phone: string | null | undefined,
): string | null => {
  if (!phone) return null
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) return null
  return `${digits}@s.whatsapp.net`
}

export const mediaSrc = (mediaUrl: string | null | undefined): string => {
  if (!mediaUrl) return ''
  const base = import.meta.env.VITE_MEDIA_BASE_URL ?? ''
  return `${base}${mediaUrl}`
}
