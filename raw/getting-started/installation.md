# Installation

> Set up the CommerceJS monorepo and install all dependencies.

CommerceJS uses a pnpm monorepo. All packages live under the `packages/` directory and share a common build toolchain.

## Prerequisites

You need the following tools installed:

- **Node.js** 20 or later
- **pnpm** 9 or later

## Clone and Install

<steps>

### Clone the repository

```bash
git clone https://github.com/commercejs/commercejs.git
cd commercejs
```

### Install dependencies

```bash
pnpm install
```

### Build all packages

The packages depend on each other, so build them in order:

```bash
pnpm --filter @commercejs/types build
pnpm --filter @commercejs/checkout build
pnpm --filter @commercejs/payment-tap build
pnpm --filter @commercejs/webhook-verifier build
pnpm --filter @commercejs/adapter-salla build
```

<tip>

You can also build everything at once with `pnpm -r build`, but the ordered approach is more reliable for the first build.

</tip>
</steps>

## Environment Setup

The hosted checkout application requires Tap Payments credentials. Create an `.env` file:

```bash [packages/hosted-checkout/.env]
TAP_SECRET_KEY="sk_test_your_key_here"
TAP_PUBLIC_KEY="pk_test_your_key_here"
TAP_BASE_URL="https://api.tap.company/v2"
TAP_MERCHANT_ID="your_merchant_id"
APP_URL="http://localhost:3100"
```

<note>

Get your test keys from the [Tap Dashboard](https://dashboard.tap.company). The `APP_URL` is used for payment redirects and webhook URLs.

</note>

## Run the Hosted Checkout

Start the development server for the hosted checkout application:

```bash
cd packages/hosted-checkout
pnpm dev
```

The checkout page is available at `http://localhost:3100`.

## Monorepo Structure

```text
commercejs/
├── packages/
│   ├── types/              # @commercejs/types
│   ├── checkout/           # @commercejs/checkout
│   ├── payment-tap/        # @commercejs/payment-tap
│   ├── webhook-verifier/   # @commercejs/webhook-verifier
│   ├── adapter-salla/      # @commercejs/adapter-salla
│   ├── hosted-checkout/    # Nuxt checkout application
│   ├── storefront/         # Nuxt storefront application
│   ├── core/               # Core utilities
│   └── docs/               # This documentation site
├── pnpm-workspace.yaml
└── package.json
```
