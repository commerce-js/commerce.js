# Introduction

> CommerceJS is a modular, provider-agnostic eCommerce toolkit for JavaScript and TypeScript.

CommerceJS is a modular eCommerce SDK that provides unified types, a checkout engine, and pluggable payment providers. It works across any JavaScript runtime — Node.js, Edge, Deno, or the browser.

## The Problem

Every eCommerce platform has its own API, data shapes, and payment flow. Building a storefront that works with Salla requires completely different code than one for Shopify or WooCommerce. Switching payment providers means rewriting your checkout.

CommerceJS solves this with three core ideas:

1. **Unified types** — A single data model for products, carts, orders, and customers that works across every platform.
2. **Adapter pattern** — Each platform implements the `CommerceAdapter` interface, mapping its API to the unified types.
3. **Pluggable providers** — Payment providers implement the `PaymentProvider` interface, making them interchangeable.

## Package Ecosystem

The toolkit is organized as a monorepo of focused packages:

<table>
<thead>
  <tr>
    <th>
      Package
    </th>
    
    <th>
      Purpose
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        @commercejs/types
      </code>
    </td>
    
    <td>
      Unified data model — 20+ domain types
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        @commercejs/checkout
      </code>
    </td>
    
    <td>
      CheckoutSession state machine
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        @commercejs/payment-tap
      </code>
    </td>
    
    <td>
      Tap Payments provider
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        @commercejs/webhook-verifier
      </code>
    </td>
    
    <td>
      Cryptographic webhook verification
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        @commercejs/adapter-salla
      </code>
    </td>
    
    <td>
      Salla platform adapter
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        @commercejs/hosted-checkout
      </code>
    </td>
    
    <td>
      Ready-to-deploy Nuxt checkout page
    </td>
  </tr>
</tbody>
</table>

## Who Is This For?

CommerceJS is designed for developers building:

- **Storefronts** that need to work with multiple eCommerce backends
- **Checkout flows** with pluggable payment providers
- **Multi-tenant platforms** where each merchant uses a different payment gateway
- **Headless commerce** applications that need a clean separation between frontend and backend

## Next Steps

<card-group>
<card icon="i-lucide-download" title="Installation" to="/getting-started/installation">

Set up the monorepo and install dependencies.

</card>

<card icon="i-lucide-rocket" title="Quick Start" to="/getting-started/quick-start">

Process your first payment in 5 minutes.

</card>

<card icon="i-lucide-layers" title="Architecture" to="/architecture/overview">

Understand how the packages fit together.

</card>
</card-group>
