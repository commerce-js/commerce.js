<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Platform-level settings live here (defaults for new merchants, etc.).
// For Step 7 we only show informational fields; mutation lands when a
// separate `platform_settings` control-DB table is needed.
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-6 py-4 max-w-2xl space-y-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Platform defaults
            </h2>
          </template>

          <p class="text-sm text-muted">
            When a merchant is created, these defaults apply unless overridden
            on the form. For now these are hard-coded; a platform-settings
            table lands alongside the first-time-onboarding flow.
          </p>

          <dl class="mt-4 grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-muted">
              Default currency
            </dt>
            <dd class="font-mono">
              SAR
            </dd>
            <dt class="text-muted">
              Default locale
            </dt>
            <dd class="font-mono">
              ar-SA
            </dd>
            <dt class="text-muted">
              Default plan
            </dt>
            <dd class="font-mono">
              trial
            </dd>
            <dt class="text-muted">
              Neon region
            </dt>
            <dd class="font-mono">
              aws-eu-central-1
            </dd>
            <dt class="text-muted">
              Fly region
            </dt>
            <dd class="font-mono">
              bah (Bahrain)
            </dd>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Integrations
            </h2>
          </template>

          <p class="text-sm text-muted">
            Secrets (Neon API key, Redis, Stripe, SMTP) are managed via
            <code class="font-mono">flyctl secrets set</code> or the
            monorepo-root <code class="font-mono">.secrets</code> file in
            development. A UI to rotate them without a redeploy is planned.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
