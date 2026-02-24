<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const title = computed(() =>
  is404.value ? 'Page not found' : 'Something went wrong',
)

const description = computed(() =>
  is404.value
    ? "The page you're looking for doesn't exist or has been moved."
    : props.error.message || 'An unexpected error occurred. Please try again.',
)

function handleClearError() {
  clearError({ redirect: '/' })
}

useHead({
  title: `${title.value} — CommerceJS`,
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-default">
      <div class="text-center max-w-md px-6">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UIcon
            :name="is404 ? 'i-heroicons-map-pin-20-solid' : 'i-heroicons-exclamation-triangle-20-solid'"
            class="text-4xl text-primary"
          />
        </div>

        <p class="text-6xl font-bold text-highlighted mb-2">
          {{ error.statusCode }}
        </p>

        <h1 class="text-xl font-semibold text-highlighted mb-2">
          {{ title }}
        </h1>

        <p class="text-muted mb-8">
          {{ description }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <UButton size="lg" color="primary" @click="handleClearError">
            <UIcon name="i-heroicons-home-20-solid" class="mr-2" />
            Go Home
          </UButton>
          <UButton
            size="lg"
            variant="outline"
            color="neutral"
            to="/products"
            @click="clearError()"
          >
            Browse Products
          </UButton>
        </div>
      </div>
    </div>
  </UApp>
</template>
