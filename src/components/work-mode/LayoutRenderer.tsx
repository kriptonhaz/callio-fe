import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LayoutSectionsJson } from '@/lib/api/types/layout-configs.types'
import { resolveFieldMeta, type FieldMeta } from '@/lib/layout/field-registry'
import {
  getLeadValue,
  setLeadValue,
  type LeadFormValues,
} from '@/lib/layout/lead-value'
import { sortLayout } from '@/lib/layout/default-layout'

interface LayoutRendererProps {
  layout: LayoutSectionsJson
  values: LeadFormValues
  onChange: (next: LeadFormValues) => void
  disabled?: boolean
}

export function LayoutRenderer({
  layout,
  values,
  onChange,
  disabled,
}: LayoutRendererProps) {
  const sorted = useMemo(() => sortLayout(layout), [layout])

  return (
    <div className="flex flex-col gap-4">
      {sorted.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const meta = resolveFieldMeta(field.key)
                if (!meta) return null
                const readOnly = disabled || !field.editable
                const value = getLeadValue(values, field.key)
                const fullWidth =
                  meta.type === 'textarea' ? 'sm:col-span-2' : ''

                return (
                  <div
                    key={field.key}
                    className={`flex flex-col gap-1 ${fullWidth}`}
                  >
                    <label className="text-xs text-muted-foreground">
                      {field.label || meta.defaultLabel}
                    </label>
                    <FieldInput
                      meta={meta}
                      value={value}
                      readOnly={readOnly}
                      onChange={(v) =>
                        onChange(setLeadValue(values, field.key, v))
                      }
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FieldInput({
  meta,
  value,
  readOnly,
  onChange,
}: {
  meta: FieldMeta
  value: unknown
  readOnly: boolean
  onChange: (v: unknown) => void
}) {
  const strVal = value == null ? '' : String(value)

  switch (meta.type) {
    case 'textarea':
      return (
        <Textarea
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[60px]"
        />
      )
    case 'select':
      return (
        <Select
          value={strVal || 'unset'}
          disabled={readOnly}
          onValueChange={(v) => onChange(v === 'unset' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">-</SelectItem>
            {meta.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'date':
      return (
        <Input
          type="date"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'email':
      return (
        <Input
          type="email"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'phone':
      return (
        <Input
          type="tel"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          placeholder="+62812345678"
        />
      )
    case 'text':
    default:
      return (
        <Input
          type="text"
          value={strVal}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
