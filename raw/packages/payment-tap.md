# @commercejs/payment-tap

> Tap Payments provider — charges, 3DS redirects, refunds, and per-transaction webhooks for the MENA region.

The `@commercejs/payment-tap` package implements the `PaymentProvider` interface for [Tap Payments](https://tap.company), the leading payment gateway in the MENA region.

## Installation

```bash
pnpm add @commercejs/payment-tap
```

## Configuration

```ts
import { TapPaymentProvider } from '@commercejs/payment-tap'

const provider = new TapPaymentProvider({
  secretKey: 'sk_test_xxx',
  baseUrl: 'https://api.tap.company/v2',
  merchantId: '1632424', // optional
})
```

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
        secretKey
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
      Tap secret API key
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        baseUrl
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
      API base URL (default: <code>
        https://api.tap.company/v2
      </code>
      
      )
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        merchantId
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
      Tap merchant ID for multi-merchant setups
    </td>
  </tr>
</tbody>
</table>

## Creating a Charge

The `createSession` method creates a Tap charge and returns a `PaymentSession`:

```ts
const session = await provider.createSession({
  amount: 99.999,
  currency: 'BHD',
  sourceToken: 'tok_xxx',        // From goSell.js tokenization
  returnUrl: 'https://myapp.com/confirm',
  webhookUrl: 'https://myapp.com/api/webhooks/tap',
  customer: {
    email: 'ahmed@example.com',
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    phone: '+97312345678',
  },
  orderId: 'order-001',
})
```

The `webhookUrl` maps to Tap's `post.url` field — Tap sends charge results to this URL asynchronously.

<note>

Most card payments return a `redirectUrl` for 3DS verification. Redirect the customer to this URL, and Tap will redirect back to your `returnUrl` after verification.

</note>

## Confirming a Charge

After 3DS redirect, confirm the payment by charge ID:

```ts
const confirmed = await provider.confirmSession('chg_abc123')
// confirmed.status === 'captured' | 'failed' | 'cancelled'
```

## Tap Status Mapping

The provider maps Tap's charge statuses to `PaymentSessionStatus`:

<table>
<thead>
  <tr>
    <th>
      Tap Status
    </th>
    
    <th>
      PaymentSessionStatus
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        INITIATED
      </code>
    </td>
    
    <td>
      <code>
        pending
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        IN_PROGRESS
      </code>
    </td>
    
    <td>
      <code>
        processing
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        CAPTURED
      </code>
    </td>
    
    <td>
      <code>
        captured
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        FAILED
      </code>
    </td>
    
    <td>
      <code>
        failed
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        DECLINED
      </code>
    </td>
    
    <td>
      <code>
        failed
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        CANCELLED
      </code>
    </td>
    
    <td>
      <code>
        cancelled
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        ABANDONED
      </code>
    </td>
    
    <td>
      <code>
        cancelled
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        TIMEDOUT
      </code>
    </td>
    
    <td>
      <code>
        failed
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        VOID
      </code>
    </td>
    
    <td>
      <code>
        cancelled
      </code>
    </td>
  </tr>
</tbody>
</table>

## Webhook Handling

Tap sends charge results to the `post.url` specified in the charge request. Use `@commercejs/webhook-verifier` to verify these events:

```ts
import { WebhookVerifier } from '@commercejs/webhook-verifier'
import { tap as tapConfig } from '@commercejs/webhook-verifier/configs'

const verifier = new WebhookVerifier({
  ...tapConfig,
  secretKey: 'sk_test_xxx',
})

const result = verifier.verify(body, headers)
if (result.isValid) {
  // Process the charge update
}
```

<read-more to="/packages/webhook-verifier">

See the webhook-verifier package for detailed verification documentation.

</read-more>

## Multi-Merchant Support

For marketplace scenarios where each merchant has their own Tap account, create a provider instance per merchant:

```ts
function getProviderForMerchant(merchantId: string): TapPaymentProvider {
  const config = getMerchantConfig(merchantId)
  return new TapPaymentProvider({
    secretKey: config.tapSecretKey,
    merchantId: config.tapMerchantId,
  })
}
```

## Supported Currencies

Tap supports currencies across the MENA region:

<table>
<thead>
  <tr>
    <th>
      Currency
    </th>
    
    <th>
      Code
    </th>
    
    <th>
      Decimals
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      Bahraini Dinar
    </td>
    
    <td>
      <code>
        BHD
      </code>
    </td>
    
    <td>
      3
    </td>
  </tr>
  
  <tr>
    <td>
      Saudi Riyal
    </td>
    
    <td>
      <code>
        SAR
      </code>
    </td>
    
    <td>
      2
    </td>
  </tr>
  
  <tr>
    <td>
      Kuwaiti Dinar
    </td>
    
    <td>
      <code>
        KWD
      </code>
    </td>
    
    <td>
      3
    </td>
  </tr>
  
  <tr>
    <td>
      UAE Dirham
    </td>
    
    <td>
      <code>
        AED
      </code>
    </td>
    
    <td>
      2
    </td>
  </tr>
  
  <tr>
    <td>
      Omani Rial
    </td>
    
    <td>
      <code>
        OMR
      </code>
    </td>
    
    <td>
      3
    </td>
  </tr>
  
  <tr>
    <td>
      Qatari Riyal
    </td>
    
    <td>
      <code>
        QAR
      </code>
    </td>
    
    <td>
      2
    </td>
  </tr>
  
  <tr>
    <td>
      Egyptian Pound
    </td>
    
    <td>
      <code>
        EGP
      </code>
    </td>
    
    <td>
      2
    </td>
  </tr>
  
  <tr>
    <td>
      US Dollar
    </td>
    
    <td>
      <code>
        USD
      </code>
    </td>
    
    <td>
      2
    </td>
  </tr>
</tbody>
</table>
