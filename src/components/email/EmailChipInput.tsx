import {  useState } from 'react'
import { X } from 'lucide-react'
import type {KeyboardEvent} from 'react';
import { cn } from '@/lib/utils'

interface Props {
  value: Array<string>
  onChange: (next: Array<string>) => void
  placeholder?: string
  id?: string
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export function EmailChipInput({ value, onChange, placeholder, id }: Props) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const commit = (raw: string) => {
    const candidates = raw
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (candidates.length === 0) return true
    const valid: Array<string> = []
    for (const c of candidates) {
      if (!isValidEmail(c)) {
        setError(`"${c}" is not a valid email`)
        return false
      }
      if (!value.includes(c)) valid.push(c)
    }
    if (valid.length > 0) onChange([...value, ...valid])
    setError(null)
    return true
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault()
      if (commit(draft)) setDraft('')
      return
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border bg-background px-2 py-1.5 text-sm focus-within:ring-1 focus-within:ring-ring',
          error && 'border-destructive',
        )}
      >
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim() && commit(draft)) setDraft('')
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[160px] bg-transparent outline-none"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
