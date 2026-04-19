import { useMemo } from 'react'
import { sanitizeEmailHtml } from '@/lib/email/sanitize'

interface Props {
  html: string
  className?: string
}

/**
 * Renders sanitized email HTML inside a sandboxed iframe. The iframe sandbox
 * attribute is empty (no allow-scripts, no allow-top-navigation) so even if
 * DOMPurify misses an exploit, nothing executes. Styles are isolated from the
 * host app because the iframe is a separate document.
 */
export function HtmlEmailFrame({ html, className }: Props) {
  const srcDoc = useMemo(() => {
    const cleaned = sanitizeEmailHtml(html)
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
      html,body{margin:0;padding:16px;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#fff;word-break:break-word;}
      img{max-width:100%;height:auto;}
      a{color:#2563eb;text-decoration:underline;}
      table{max-width:100%;}
      pre,code{white-space:pre-wrap;word-break:break-word;}
    </style></head><body>${cleaned}</body></html>`
  }, [html])

  return (
    <iframe
      title="Email body"
      sandbox="allow-popups"
      srcDoc={srcDoc}
      className={className ?? 'w-full min-h-[400px] max-h-[70vh] bg-white rounded border'}
    />
  )
}
