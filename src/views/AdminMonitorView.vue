<template>
  <div :data-theme="store.decision.themeId" class="contents">
  <AdminShellFrame
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
    title="Admin Monitor"
    brand-name="IntelligentB2B"
    search-label="Search clients"
    command-symbol="Ctrl"
    command-key="K"
    :sections="sidebarSections"
    @search="spotlightOpen = true"
  >
    <template #sidebarFooter>
      <ProfileDock
        detail="Monitoring Portal"
        :name="auth.userEmail ?? 'Admin'"
        @sign-out="handleSignOut"
      />
    </template>

    <template #topbarActions>
      <button
        type="button"
        class="btn btn-sm rounded-lg border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
        aria-label="Refresh admin monitor"
        :disabled="isRefreshing || isLoading"
        @click="refreshAll"
      >
        <PhArrowClockwise :size="16" :class="isRefreshing ? 'animate-spin' : ''" />
      </button>
    </template>

    <template #topbarCta>
      <button
        type="button"
        class="btn btn-primary admin-action-button"
        @click="handleInvite"
      >
        Invite Client
        <PhPlus :size="16" weight="regular" />
      </button>
    </template>

    <template #default>
      <div class="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-3 md:p-5">
        <p
          v-if="loadError"
          class="rounded-xl border border-error/40 bg-error/15 px-3 py-2 text-sm text-error-content"
        >
          {{ loadError }}
        </p>

        <!-- Overview section -->
        <div>
          <h2 class="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/35">Overview</h2>
          <AdminKpiStrip :summary="kpiSummary" :loading="isLoading" />
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminAlertsCard
              :alerts="dashboardSnapshot?.alerts ?? []"
              :clients-map="clientsMap"
              :loading="isLoading"
            />
            <AdminQuickActionsCard
              :blocked-count="blockedCount"
              :loading="isRefreshing"
              @invite="handleInvite"
              @review-blocked="handleReviewBlocked"
              @open-chat="handleOpenChat"
              @refresh="refreshAll"
            />
          </div>
        </div>
      </div>
    </template>
  </AdminShellFrame>

  <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
  <ClientProvisionModal :open="provisionOpen" @close="provisionOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhArrowClockwise,
  PhBell,
  PhChartLineUp,
  PhChatTeardropText,
  PhPlus,
  PhUsersThree,
} from '@phosphor-icons/vue'

import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import { useHotkey } from '@/composables/useHotkey'
import AdminAlertsCard from '@/components/admin/AdminAlertsCard.vue'
import ClientProvisionModal from '@/components/admin/ClientProvisionModal.vue'
import AdminKpiStrip from '@/components/admin/AdminKpiStrip.vue'
import AdminQuickActionsCard from '@/components/admin/AdminQuickActionsCard.vue'
import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type { AdminDashboardSnapshot, ClientSummary } from '@/contracts/api'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

const store = useSpecLabStore()
const auth = useAuthStore()
const router = useRouter()

const spotlightOpen = ref(false)
const provisionOpen = ref(false)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => { spotlightOpen.value = !spotlightOpen.value },
})

const isLoading = ref(true)
const isRefreshing = ref(false)
const loadError = ref('')

const dashboardSnapshot = ref<AdminDashboardSnapshot | null>(null)
const clients = ref<ClientSummary[]>([])

const sidebarSections = computed(() => [
  {
    title: 'Monitor',
    items: [
      { label: 'Overview', to: '/admin/monitor', active: true, icon: PhChartLineUp },
      { label: 'Clients', to: '/admin/clients', icon: PhUsersThree, badge: String(clients.value.length) },
      {
        label: 'Alerts',
        to: '/admin/alerts',
        icon: PhBell,
        badge: String(dashboardSnapshot.value?.alerts.filter((a) => a.status === 'open').length ?? 0),
      },
    ],
  },
  {
    title: 'Portal',
    items: [{ label: 'Client Chat', to: '/portal/chat/demo-token', icon: PhChatTeardropText }],
  },
])

const clientsMap = computed<Record<string, ClientSummary>>(() =>
  Object.fromEntries(clients.value.map((c) => [c.id, c]))
)

const blockedCount = computed(() => dashboardSnapshot.value?.totals.blocked ?? 0)

const kpiSummary = computed(() => {
  if (!dashboardSnapshot.value) {
    return { active: 0, invited: 0, blocked: 0, completionAverage: 0, staleClients: 0, ingestHealth: 0 }
  }
  const ingest = dashboardSnapshot.value.ingest
  const ingestTotal = ingest.healthy + ingest.warning + ingest.failed + ingest.queued
  return {
    active: dashboardSnapshot.value.totals.active,
    invited: dashboardSnapshot.value.totals.invited,
    blocked: dashboardSnapshot.value.totals.blocked,
    completionAverage: Math.round(dashboardSnapshot.value.completion.average),
    staleClients: dashboardSnapshot.value.freshness.stale,
    ingestHealth: ingestTotal > 0 ? Math.round((ingest.healthy / ingestTotal) * 100) : 0,
  }
})

async function loadInitialData(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    const [snapshot, clientRows] = await Promise.all([
      apiClient.getAdminDashboardSnapshot(),
      apiClient.getClients(),
    ])
    dashboardSnapshot.value = snapshot
    clients.value = clientRows
  } catch {
    loadError.value = 'Unable to load admin monitor data right now.'
  } finally {
    isLoading.value = false
  }
}

async function refreshAll(): Promise<void> {
  isRefreshing.value = true
  try {
    await loadInitialData()
  } finally {
    isRefreshing.value = false
  }
}

function handleInvite(): void {
  provisionOpen.value = true
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // Non-fatal
  }
  await router.replace({ name: 'admin-login' })
}

function handleReviewBlocked(): void {
  router.push({ name: 'admin-clients', query: { status: 'blocked' } })
}

function handleOpenChat(): void {
  router.push({ name: 'portal-chat' })
}

onMounted(loadInitialData)
</script>
