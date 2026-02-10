# CheckoutSession

> The CheckoutSession class — a framework-agnostic state machine for the checkout lifecycle.

The `CheckoutSession` class orchestrates the complete checkout flow from customer info through payment and confirmation. It enforces valid state transitions, emits events, and works on any JavaScript runtime.

## Constructor

```ts
new CheckoutSession(config: CheckoutSessionConfig)
```

### CheckoutSessionConfig

<table>
<thead>
  <tr>
    <th>
      Property
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
      Order total amount
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

## Properties

All properties are read-only getters:

<table>
<thead>
  <tr>
    <th>
      Property
    </th>
    
    <th>
      Type
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
        state
      </code>
    </td>
    
    <td>
      <code>
        CheckoutState
      </code>
    </td>
    
    <td>
      Current state machine state
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        customerInfo
      </code>
    </td>
    
    <td>
      <code>
        CheckoutCustomerInfo | null
      </code>
    </td>
    
    <td>
      Customer details
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        shippingAddress
      </code>
    </td>
    
    <td>
      <code>
        Address | null
      </code>
    </td>
    
    <td>
      Shipping address
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        billingAddress
      </code>
    </td>
    
    <td>
      <code>
        Address | null
      </code>
    </td>
    
    <td>
      Billing address
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        shippingMethodId
      </code>
    </td>
    
    <td>
      <code>
        string | null
      </code>
    </td>
    
    <td>
      Selected shipping method
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        paymentSession
      </code>
    </td>
    
    <td>
      <code>
        PaymentSession | null
      </code>
    </td>
    
    <td>
      Current payment session
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
      Order amount
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
      Currency code
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
        string | null
      </code>
    </td>
    
    <td>
      Order ID
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        error
      </code>
    </td>
    
    <td>
      <code>
        Error | null
      </code>
    </td>
    
    <td>
      Last error
    </td>
  </tr>
</tbody>
</table>

## Methods

### setCustomerInfo(info)

```ts
setCustomerInfo(info: CheckoutCustomerInfo): void
```

Set customer details. Transitions from `idle` to `info`.

**CheckoutCustomerInfo:**

<table>
<thead>
  <tr>
    <th>
      Field
    </th>
    
    <th>
      Type
    </th>
    
    <th>
      Required
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        email
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
  </tr>
  
  <tr>
    <td>
      <code>
        firstName
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
  </tr>
  
  <tr>
    <td>
      <code>
        lastName
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
  </tr>
  
  <tr>
    <td>
      <code>
        phone
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
  </tr>
</tbody>
</table>

### setShippingAddress(address, billingAddress?)

```ts
setShippingAddress(
  address: Omit<Address, 'id' | 'isDefault'>,
  billingAddress?: Omit<Address, 'id' | 'isDefault'>
): void
```

Set shipping address. Transitions from `info` to `shipping`. If `billingAddress` is omitted, the shipping address is used for billing.

### setShippingMethod(methodId)

```ts
setShippingMethod(methodId: string): void
```

Set the shipping method. Does not trigger a state transition. Must be in `shipping` state.

### setAmount(amount)

```ts
setAmount(amount: number): void
```

Update the order amount. Can be called before payment is submitted.

### setOrderId(orderId)

```ts
setOrderId(orderId: string): void
```

Set the order ID if not provided at construction time.

### submitPayment(options?)

```ts
submitPayment(options?: {
  sourceToken?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}): Promise<PaymentSession>
```

Create a payment session with the provider. Transitions from `shipping` (or `failed` for retries) to `payment`.

Returns a `PaymentSession` with an optional `redirectUrl` for 3DS.

### confirmPayment(sessionId?)

```ts
confirmPayment(sessionId?: string): Promise<PaymentSession>
```

Confirm payment after 3DS redirect. Must be in `payment` state. Transitions to `complete` or `failed`.

### handleWebhookUpdate(paymentSession)

```ts
handleWebhookUpdate(paymentSession: PaymentSession): void
```

Handle an async webhook update. Works from any non-terminal state. Transitions directly to `complete` (for `captured`) or `failed` (for `failed`/`cancelled`).

### toSnapshot()

```ts
toSnapshot(): CheckoutSnapshot
```

Get a serializable snapshot of the current session state.

**CheckoutSnapshot:**

```ts
interface CheckoutSnapshot {
  state: CheckoutState
  customerInfo: CheckoutCustomerInfo | null
  shippingAddress: Omit<Address, 'id' | 'isDefault'> | null
  billingAddress: Omit<Address, 'id' | 'isDefault'> | null
  shippingMethodId: string | null
  paymentSession: PaymentSession | null
  amount: number
  currency: string
  orderId: string | null
  error: string | null
}
```

## Events

The session extends `EventEmitter` and emits these events:

<table>
<thead>
  <tr>
    <th>
      Event
    </th>
    
    <th>
      Payload
    </th>
    
    <th>
      When
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        stateChange
      </code>
    </td>
    
    <td>
      <code>
        { from: CheckoutState, to: CheckoutState }
      </code>
    </td>
    
    <td>
      Any state transition
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        complete
      </code>
    </td>
    
    <td>
      <code>
        { paymentSession: PaymentSession }
      </code>
    </td>
    
    <td>
      Payment captured
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        error
      </code>
    </td>
    
    <td>
      <code>
        { error: Error, state: CheckoutState }
      </code>
    </td>
    
    <td>
      Payment failed
    </td>
  </tr>
</tbody>
</table>

```ts
session.on('stateChange', ({ from, to }) => {
  console.log(`${from} → ${to}`)
})
```

## State Transitions

```ts
type CheckoutState =
  | 'idle'
  | 'info'
  | 'shipping'
  | 'payment'
  | 'confirming'
  | 'complete'
  | 'failed'
```

Valid transitions:

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
      Method
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
      <code>
        submitPayment()
      </code>
      
       (retry)
    </td>
  </tr>
</tbody>
</table>

Invalid transitions throw `Error: Invalid transition: "{from}" → "{to}"`.
