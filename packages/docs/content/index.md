---
seo:
  title: CommerceJS — Modular eCommerce Toolkit
  description: A provider-agnostic eCommerce toolkit for JavaScript and TypeScript. Unified types, pluggable payment providers, and a checkout engine that works anywhere.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
---
orientation: horizontal
---
#top
:hero-background

#title
Universal [eCommerce]{.text-primary} Toolkit.

#description
A modular, provider-agnostic eCommerce SDK for JavaScript and TypeScript. Unified types across platforms, pluggable payment providers, and a checkout engine that works on any runtime.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get Started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/commerce-js/commerce.js
  target: _blank
  ---
  GitHub
  :::

#default
  :::prose-pre
  ---
  code: |
    import { createCommerce } from '@commercejs/core'
    import { SallaAdapter } from '@commercejs/adapter-salla'
    import { TapPaymentProvider } from '@commercejs/payment-tap'

    const commerce = createCommerce({
      adapter: new SallaAdapter({ token }),
      payments: { tap: new TapPaymentProvider({ secretKey }) },
      defaultPayment: 'tap',
    })

    const products = await commerce.getProducts({ query: 'shirt' })
  filename: example.ts
  ---

  ```ts [example.ts]
  import { createCommerce } from '@commercejs/core'
  import { SallaAdapter } from '@commercejs/adapter-salla'
  import { TapPaymentProvider } from '@commercejs/payment-tap'

  const commerce = createCommerce({
    adapter: new SallaAdapter({ token }),
    payments: { tap: new TapPaymentProvider({ secretKey }) },
    defaultPayment: 'tap',
  })

  const products = await commerce.getProducts({ query: 'shirt' })
  ```
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Built for flexibility

#links
  :::u-button
  ---
  color: neutral
  size: lg
  to: /architecture/overview
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  View Architecture
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-puzzle
  ---
  #title
  Adapter Pattern

  #description
  Connect any eCommerce platform — Salla, Shopify, WooCommerce — through a unified interface. One API, many backends.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-credit-card
  ---
  #title
  Pluggable Payments

  #description
  Swap payment providers without rewriting your checkout. Tap, Stripe, PayPal — each implements the same PaymentProvider interface.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-workflow
  ---
  #title
  Checkout Engine

  #description
  A framework-agnostic state machine that handles the full checkout flow — from customer info to payment confirmation with 3DS support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Webhook Verification

  #description
  Cryptographic webhook verification with built-in presets for Tap, Stripe, and more. Trust every event your server receives.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package
  ---
  #title
  TypeScript First

  #description
  Every package ships with full type definitions. The unified type system covers products, carts, orders, payments, and more.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-globe
  ---
  #title
  Runtime Agnostic

  #description
  Works in Node.js, Edge runtimes, Deno, and the browser. No framework lock-in — use with Nuxt, Next.js, Express, or anything else.
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
The package ecosystem

#features
  :::u-page-feature
  ---
  icon: i-lucide-cpu
  ---
  #title
  @commercejs/core

  #description
  The orchestration engine — createCommerce(), event bus, capability routing, and webhook dispatch. One entry point, any adapter.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-box
  ---
  #title
  @commercejs/types

  #description
  Unified data model — Product, Cart, Order, Customer, and 20+ domain types that work across every platform adapter.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shopping-cart
  ---
  #title
  @commercejs/checkout

  #description
  The CheckoutSession state machine. Manages the flow from idle → info → shipping → payment → complete.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-wallet
  ---
  #title
  @commercejs/payment-tap

  #description
  Tap Payments provider — charges, 3DS redirects, refunds, and per-transaction webhooks for the MENA region.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-lock
  ---
  #title
  @commercejs/webhook-verifier

  #description
  Provider-agnostic webhook verification. Built-in hashstring verification for Tap with extensible config for any provider.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-store
  ---
  #title
  @commercejs/adapter-salla

  #description
  Salla platform adapter — maps Salla's API to the unified CommerceAdapter interface for products, carts, orders, and more.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layout-dashboard
  ---
  #title
  @commercejs/hosted-checkout

  #description
  A ready-to-deploy Nuxt application for hosted checkout. Drop-in payment page with goSell.js integration.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  ---
  #title
  @commercejs/platform

  #description
  Built-in commerce engine — zero-config, SQLite-backed. Own your data with 12 implemented domains and dual database drivers.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-hexagon
  ---
  #title
  @commercejs/nuxt

  #description
  Nuxt module — auto-imported composables, server-generated REST API, and a runtime plugin that wires the adapter into your app.
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: Get Started
      to: '/getting-started'
      trailingIcon: i-lucide-arrow-right
    - label: View on GitHub
      to: 'https://github.com/commerce-js/commerce.js'
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: Ready to build?
  description: CommerceJS gives you the building blocks. You choose the platform, the payment provider, and the framework.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
