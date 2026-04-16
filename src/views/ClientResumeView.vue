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
      </div>
      <ProfileDock :detail="auth.userEmail ?? ''" :name="auth.userEmail ?? 'Client Portal'" />
    </template>

    <div class="space-y-4">
      <header class="aura-glass rounded-[1.3rem] p-5">
        <h1 class="aura-heading text-3xl font-semibold">Onboarding Snapshot</h1>
        <p class="mt-2 text-sm text-base-content/70">A quick summary of what has been captured so far.</p>
      </header>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid gap-4 md:grid-cols-2">
        <div v-for="n in 2" :key="n" class="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="h-4 w-1/3 animate-pulse rounded bg-base-300/60" />
          <div class="h-3 w-full animate-pulse rounded bg-base-300/60" />
          <div class="h-3 w-4/5 animate-pulse rounded bg-base-300/60" />
          <div class="h-3 w-3/4 animate-pulse rounded bg-base-300/60" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        {{ loadError }}
      </div>

      <!-- Data -->
      <section v-else class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="font-semibold text-base-content">Captured</h2>
          <ul v-if="capturedItems.length > 0" class="mt-3 space-y-2 text-sm text-base-content/80">
            <li v-for="item in capturedItems" :key="item.label">
              <span class="font-medium">{{ item.label }}:</span> {{ item.value }}
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-base-content/40">Nothing captured yet.</p>
        </article>

        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="font-semibold text-base-content">Still Needed</h2>
          <ul v-if="pendingItems.length > 0" class="mt-3 space-y-2 text-sm text-base-content/80">
            <li v-for="item in pendingItems" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="mt-3 text-sm text-base-content/40">Nothing pending — you're all set!</p>
        </article>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type { OnboardingSnapshot } from '@/contracts/api'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

const store = useSpecLabStore()
const auth = useAuthStore()

const loading = ref(true)
const loadError = ref('')
const snapshot = ref<OnboardingSnapshot | null>(null)

const capturedItems = computed(() => {
  const s = snapshot.value
  if (!s) return []
  const items: { label: string; value: string }[] = []
  if (s.businessModel) items.push({ label: 'Business model', value: s.businessModel })
  if (s.brandDirection) items.push({ label: 'Brand direction', value: s.brandDirection })
  if (s.targetAudience) items.push({ label: 'Target audience', value: s.targetAudience })
  if (s.requiredIntegrations.length > 0) items.push({ label: 'Integrations', value: s.requiredIntegrations.join(', ') })
  return items
})

const pendingItems = computed(() => snapshot.value?.pendingItems ?? [])

onMounted(async () => {
  try {
    const session = await apiClient.getPortalSession()
    snapshot.value = session.snapshot
  } catch {
    loadError.value = 'Unable to load your onboarding summary. Please try again.'
  } finally {
    loading.value = false
  }
})
</script>
