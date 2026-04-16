<template>
  <AppShell
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
  >
    <template #sidebar>
      <AuraLogo />
      <div class="mt-6 space-y-2">
        <RouterLink class="btn btn-sm w-full justify-start rounded-xl" :to="{ name: 'portal-chat' }">Back to Chat</RouterLink>
        <RouterLink class="btn btn-sm w-full justify-start rounded-xl" to="/admin/monitor">Admin Monitor</RouterLink>
      </div>
      <ProfileDock detail="Client Portal" name="Aura Resume" />
    </template>

    <div class="space-y-4">
      <header class="aura-glass rounded-[1.3rem] p-5">
        <h1 class="aura-heading text-3xl font-semibold">Resume Onboarding</h1>
        <p class="mt-2 text-sm text-base-content/70">Quick snapshot of what has been captured and what is still missing.</p>
      </header>

      <section class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="font-semibold">Captured</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li>Business model: Private clinic membership programs</li>
            <li>Brand direction: Premium calm minimal</li>
            <li>Audience: Families + corporate wellness clients</li>
          </ul>
        </article>
        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="font-semibold">Missing</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li>Logo source files</li>
            <li>Traffic baseline for conversion targets</li>
            <li>Launch date confirmation</li>
          </ul>
        </article>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import { useSpecLabStore } from '@/stores/spec-lab'

const store = useSpecLabStore()
</script>
