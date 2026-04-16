<template>
  <div data-theme="aura-frost" class="min-h-screen bg-base-200">
    <div class="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
      <section class="grid w-full gap-6 rounded-[2rem] border border-base-300/70 bg-base-100 p-6 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div class="flex flex-col justify-center">
          <div class="mb-6">
            <AuraLogo />
          </div>

          <p class="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">404</p>
          <h1 class="aura-heading mt-3 text-4xl font-semibold tracking-[-0.04em] text-base-content md:text-5xl">
            This page slipped off the onboarding map.
          </h1>
          <p class="mt-4 max-w-xl text-sm leading-6 text-base-content/65 md:text-base">
            The link may be outdated, incomplete, or the page may have been moved. You can head back to a known area of the app below.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <RouterLink class="btn btn-primary rounded-xl px-5" :to="{ name: 'admin-login' }">
              Go to Admin Login
            </RouterLink>
            <RouterLink class="btn rounded-xl border-base-300 bg-base-200/70 px-5" :to="{ name: 'portal-login' }">
              Go to Client Portal
            </RouterLink>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-[1.6rem] border border-base-300/60 bg-base-200/70 p-6 md:p-8">
          <div class="absolute -right-10 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
          <div class="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-info/20 blur-2xl" aria-hidden="true" />

          <div class="relative flex h-full flex-col justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full border border-base-300/80 bg-base-100 px-3 py-1 text-xs font-medium text-base-content/60">
                <span class="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                Route unavailable
              </div>
              <p class="mt-5 text-sm font-medium text-base-content/55">Requested path</p>
              <p class="mt-2 break-all rounded-xl border border-base-300/80 bg-base-100 px-4 py-3 font-mono text-sm text-base-content">
                {{ route.fullPath }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
              <p class="text-sm font-semibold text-base-content">Quick tip</p>
              <p class="mt-2 text-sm leading-6 text-base-content/60">
                If you came from an old bookmark, update it after signing in from the correct portal entry point.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

import AuraLogo from '@/components/system/AuraLogo.vue'

const route = useRoute()
</script>
