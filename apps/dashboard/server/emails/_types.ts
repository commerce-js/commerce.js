// ---------------------------------------------------------------------------
// Email template contract
// ---------------------------------------------------------------------------
//
// Every template module exports a `Template<Vars>` value. `_render.ts`
// switches on the template key and calls these three functions to produce
// the final {subject, html, text} that the worker hands to the SMTP
// provider.
// ---------------------------------------------------------------------------

export interface Template<Vars extends Record<string, unknown>> {
  /** Stable template key — must match the SendEmailJob.data.template string. */
  readonly key: string
  subject: (vars: Vars) => string
  html: (vars: Vars) => string
  text: (vars: Vars) => string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}
