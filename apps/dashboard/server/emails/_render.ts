// ---------------------------------------------------------------------------
// Email template registry + render helper
// ---------------------------------------------------------------------------
//
// The worker looks up a template by its stable key and renders it with the
// job's `vars`. Templates live in sibling files; new templates register
// themselves in `TEMPLATES` below. The render helper is intentionally
// runtime-typed — template keys are strings on the wire (JSON job payloads),
// so we can't erase the `any` at the template-var boundary. Each individual
// template enforces its own `Vars` shape at the callsite.
// ---------------------------------------------------------------------------

import type { RenderedEmail, Template } from './_types'
import { staffInviteTemplate } from './staff-invite'
import { adminPasswordResetTemplate } from './admin-password-reset'
import { buyerPasswordResetTemplate } from './buyer-password-reset'

// Register every template here. Adding a new template is a one-line change.
const TEMPLATES: Record<string, Template<any>> = {
  [staffInviteTemplate.key]: staffInviteTemplate,
  [adminPasswordResetTemplate.key]: adminPasswordResetTemplate,
  [buyerPasswordResetTemplate.key]: buyerPasswordResetTemplate,
}

export function getTemplateKeys(): string[] {
  return Object.keys(TEMPLATES)
}

export function renderEmail(
  key: string,
  vars: Record<string, unknown>,
): RenderedEmail {
  const template = TEMPLATES[key]
  if (!template) {
    throw new Error(
      `Unknown email template "${key}". Registered: ${getTemplateKeys().join(', ') || '(none)'}`,
    )
  }
  return {
    subject: template.subject(vars as any),
    html: template.html(vars as any),
    text: template.text(vars as any),
  }
}
