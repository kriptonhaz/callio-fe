import { useMemo } from 'react'
import { HtmlEmailFrame } from './HtmlEmailFrame'
import type {PreviewLead} from '@/lib/email/template-variables';
import { renderPreview } from '@/lib/email/preview'
import {
  
  SAMPLE_PREVIEW_LEAD
} from '@/lib/email/template-variables'

interface Props {
  html: string
  // Optional override; defaults to a sensible Indonesian-flavored sample.
  sampleLead?: PreviewLead
  className?: string
}

// Renders an email template HTML with merge-tag substitution applied (so the
// admin sees realistic content) inside the existing sandboxed iframe.
export function HtmlEmailPreview({ html, sampleLead, className }: Props) {
  const rendered = useMemo(
    () => renderPreview(html, sampleLead ?? SAMPLE_PREVIEW_LEAD),
    [html, sampleLead],
  )
  return <HtmlEmailFrame html={rendered} className={className} />
}
