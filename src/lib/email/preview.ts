import {
  EMAIL_TEMPLATE_VARIABLES,
  
  lookupVariable
} from './template-variables'
import type {PreviewLead} from './template-variables';

// Mirror of the backend variable substitution, used only for the
// in-app preview. The actual substitution at send time is owned by the BE.
// Replaces both standard variables and `{cf.X}` custom-field references.
export function renderPreview(
  template: string,
  lead: PreviewLead,
): string {
  let out = template

  for (const variable of EMAIL_TEMPLATE_VARIABLES) {
    out = out.split(variable.key).join(lookupVariable(variable.source, lead))
  }

  // Custom fields: {cf.someKey} → lead.customFields["someKey"] || ''.
  out = out.replace(/\{cf\.([A-Za-z0-9_-]+)\}/g, (_, key: string) => {
    return lead.customFields?.[key] ?? ''
  })

  return out
}
