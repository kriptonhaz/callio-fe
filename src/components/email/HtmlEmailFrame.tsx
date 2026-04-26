import { useMemo } from 'react'
import { sanitizeEmailHtml } from '@/lib/email/sanitize'

interface Props {
  html: string
  className?: string
}

interface SplitResult {
  bodyHtml: string
  authorStyles: string
}

// Split a (possibly full-document) HTML string into:
//  - body inner HTML (everything between <body> tags, or the whole input if
//    no body tag is present)
//  - the concatenated text of all <style> blocks found anywhere in the doc
//
// We do this in the browser via DOMParser. Without it (SSR fallback), we
// just pass the input through untouched.
function splitDocument(html: string): SplitResult {
  if (typeof DOMParser === 'undefined') {
    return { bodyHtml: html, authorStyles: '' }
  }
  const looksLikeFullDoc = /<\s*(html|head|body|!doctype)\b/i.test(html)
  if (!looksLikeFullDoc) {
    return { bodyHtml: html, authorStyles: '' }
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const styleNodes = doc.querySelectorAll('style')
  const authorStyles = Array.from(styleNodes)
    .map((s) => s.textContent ?? '')
    .join('\n')
  // Remove style blocks from the parsed doc so they don't end up duplicated
  // inside the sanitized body when DOMPurify keeps them.
  styleNodes.forEach((s) => s.remove())
  const bodyHtml = doc.body?.innerHTML ?? ''
  return { bodyHtml, authorStyles }
}

/**
 * Renders sanitized email HTML inside a sandboxed iframe.
 *
 * Behaviour:
 *  - If the input is a fragment (no `<html>`/`<body>` tag), it's sanitized
 *    and dropped into the iframe body — the iframe's own minimal stylesheet
 *    handles defaults.
 *  - If the input is a full HTML document (e.g. exported template with
 *    `<head><style>` block), we split out all `<style>` content and lift it
 *    into the iframe's `<head>` so the author's styles still apply.
 *
 * The iframe sandbox attribute is empty (no allow-scripts, no allow-top-navigation)
 * so even if DOMPurify misses an exploit, nothing executes.
 */
export function HtmlEmailFrame({ html, className }: Props) {
  const srcDoc = useMemo(() => {
    const { bodyHtml, authorStyles } = splitDocument(html)
    const cleaned = sanitizeEmailHtml(bodyHtml)
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
      html,body{margin:0;padding:16px;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#fff;word-break:break-word;}
      img{max-width:100%;height:auto;}
      a{color:#2563eb;text-decoration:underline;}
      table{max-width:100%;}
      pre,code{white-space:pre-wrap;word-break:break-word;}
    </style>${authorStyles ? `<style>${authorStyles}</style>` : ''}</head><body>${cleaned}</body></html>`
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
