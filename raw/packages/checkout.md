# @commercejs/checkout

> The CheckoutSession state machine — manages the checkout flow from customer info to payment confirmation.

The `@commercejs/checkout` package provides the `CheckoutSession` class — a framework-agnostic state machine that orchestrates the complete checkout lifecycle.

## Installation

```bash
pnpm add @commercejs/checkout
```

## Basic Usage

```ts
import { CheckoutSession } from '@commercejs/checkout'
import type { PaymentProvider } from '@commercejs/types'

const session = new CheckoutSession({
  provider: myPaymentProvider,
  amount: 49.99,
  currency: 'BHD',
  orderId: 'order-123',
  returnUrl: 'https://myshop.com/checkout/confirm',
  webhookUrl: 'https://myshop.com/api/webhooks/payment',
})
```

## Configuration

The `CheckoutSessionConfig` accepts these options:

<table>
<thead>
  <tr>
    <th>
      Option
    </th>
    
    <th>
      Type
    </th>
    
    <th>
      Required
    </th>
    
    <th>
      Description
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        provider
      </code>
    </td>
    
    <td>
      <code>
        PaymentProvider
      </code>
    </td>
    
    <td>
      Yes
    </td>
    
    <td>
      Payment gateway instance
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        amount
      </code>
    </td>
    
    <td>
      <code>
        number
      </code>
    </td>
    
    <td>
      Yes
    </td>
    
    <td>
      Order total
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        currency
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      Yes
    </td>
    
    <td>
      ISO currency code
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        orderId
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      No
    </td>
    
    <td>
      External order reference
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        returnUrl
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      No
    </td>
    
    <td>
      3DS redirect return URL
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        cancelUrl
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      No
    </td>
    
    <td>
      Payment cancellation URL
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        webhookUrl
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      No
    </td>
    
    <td>
      Per-transaction webhook URL
    </td>
  </tr>
</tbody>
</table>

## Methods

### setCustomerInfo(info)

Set customer details and transition from `idle` to `info`:

```ts
session.setCustomerInfo({
  email: 'ahmed@example.com',
  firstName: 'Ahmed',
  lastName: 'Al-Rashid',
  phone: '+97312345678',
})
```

### setShippingAddress(address, billingAddress?)

Set shipping address (and optional billing address) to transition from `info` to `shipping`:

```ts
session.setShippingAddress({
  street: '123 King Faisal Highway',
  street2: null,
  city: 'Manama',
  state: null,
  country: 'BH',
  postalCode: '1234',
  district: null,
  nationalAddress: null,
})
```

### setShippingMethod(methodId)

Set the shipping method. Does not trigger a state transition — call `submitPayment()` when ready:

```ts
session.setShippingMethod('standard-shipping')
```

### submitPayment(options?)

Create a payment session and transition from `shipping` to `payment`:

```ts
const paymentSession = await session.submitPayment({
  sourceToken: 'tok_xxx',       // Tokenized card
  idempotencyKey: 'key-123',    // Prevent duplicate charges
  metadata: { source: 'web' },  // Extra data
})
```

Returns a `PaymentSession` with an optional `redirectUrl` for 3DS.

### confirmPayment(sessionId?)

Confirm payment after 3DS redirect. Transitions from `payment` to `complete` or `failed`:

```ts
const confirmed = await session.confirmPayment('chg_abc123')
```

### handleWebhookUpdate(paymentSession)

Handle async webhook events. Works from any non-terminal state:

```ts
session.handleWebhookUpdate({
  id: 'chg_xxx',
  providerId: 'tap',
  status: 'captured',
  amount: 49.99,
  currency: 'BHD',
  redirectUrl: null,
  createdAt: '2026-02-10T00:00:00Z',
})
```

### toSnapshot()

Get a serializable snapshot for SSR hydration or API responses:

```ts
const snapshot = session.toSnapshot()
// Returns CheckoutSnapshot with state, customer, payment, etc.
```

## Events

```ts
session.on('stateChange', ({ from, to }) => { /* ... */ })
session.on('complete', ({ paymentSession }) => { /* ... */ })
session.on('error', ({ error, state }) => { /* ... */ })
```

## State Transitions

<table>
<thead>
  <tr>
    <th>
      From
    </th>
    
    <th>
      To
    </th>
    
    <th>
      Trigger
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        idle
      </code>
    </td>
    
    <td>
      <code>
        info
      </code>
    </td>
    
    <td>
      <code>
        setCustomerInfo()
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        info
      </code>
    </td>
    
    <td>
      <code>
        shipping
      </code>
    </td>
    
    <td>
      <code>
        setShippingAddress()
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        shipping
      </code>
    </td>
    
    <td>
      <code>
        payment
      </code>
    </td>
    
    <td>
      <code>
        submitPayment()
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        payment
      </code>
    </td>
    
    <td>
      <code>
        confirming
      </code>
    </td>
    
    <td>
      <code>
        confirmPayment()
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        confirming
      </code>
    </td>
    
    <td>
      <code>
        complete
      </code>
    </td>
    
    <td>
      Payment captured
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        confirming
      </code>
    </td>
    
    <td>
      <code>
        failed
      </code>
    </td>
    
    <td>
      Payment declined
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        failed
      </code>
    </td>
    
    <td>
      <code>
        payment
      </code>
    </td>
    
    <td>
      Retry <code>
        submitPayment()
      </code>
    </td>
  </tr>
</tbody>
</table>

<warning>

Calling a method that requires a different state throws an error. For example, calling `submitPayment()` while in `idle` state results in `Error: Invalid transition: "idle" → "payment"`.

</warning>
