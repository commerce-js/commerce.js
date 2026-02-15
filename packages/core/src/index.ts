// ---------------------------------------------------------------------------
// @commercejs/core — Unified Commerce Orchestration Engine
// ---------------------------------------------------------------------------

export { createCommerce } from './commerce.js'
export type { CommerceConfig, CommerceInstance } from './commerce.js'

export { createOrchestrator } from './orchestrator.js'
export type { OrchestratorConfig } from './orchestrator.js'

export { createCompositeOrchestrator } from './composite.js'
export type { CompositeOrchestratorConfig } from './composite.js'

export { withPlatformFallback } from './fallback.js'

export { CommerceEventBus } from './event-bus.js'
export type { EventHandler, WildcardHandler } from './event-bus.js'

export type { CommerceEvents } from './events.js'

export { createWebhookDispatcher } from './webhook-dispatcher.js'
export type { WebhookEndpoint, WebhookDispatcherConfig, WebhookDelivery } from './webhook-dispatcher.js'

