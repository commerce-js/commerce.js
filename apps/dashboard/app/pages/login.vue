<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center">
    <div class="w-full max-w-md px-6">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white tracking-tight">
          CommerceJS <span class="text-primary-400">Cloud</span>
        </h1>
        <p class="mt-2 text-gray-400">
          Deploy and manage your commerce store
        </p>
      </div>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="text-lg font-semibold text-white">
            Sign in
          </h2>
        </template>

        <div class="space-y-4">
          <!-- GitHub OAuth -->
          <UButton
            block
            size="lg"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-github"
            label="Continue with GitHub"
            @click="() => {}"
          />

          <UDivider label="or" />

          <!-- Email / Password -->
          <UFormField label="Email">
            <UInput
              type="email"
              placeholder="you@example.com"
              size="lg"
            />
          </UFormField>

          <UFormField label="Password">
            <UInput
              type="password"
              placeholder="••••••••"
              size="lg"
            />
          </UFormField>

          <UButton
            block
            size="lg"
            color="primary"
            label="Sign in"
            @click="navigateTo('/projects')"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>
