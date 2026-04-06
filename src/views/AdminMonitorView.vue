<template>
  <AdminShellFrame
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
    title="Admin Monitor"
    cta-label="Invite Client"
    brand-name="IntelligentB2B"
    search-label="Search clients"
    command-symbol="Ctrl"
    command-key="K"
    :sections="sidebarSections"
    @search="focusSearchField"
  >
    <template #sidebarFooter>
      <ProfileDock detail="Monitoring Portal" name="Aura Admin" />
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
      <button
        type="button"
        class="btn btn-sm rounded-lg border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
        aria-label="Focus search"
        @click="focusSearchField"
      >
        <PhMagnifyingGlass :size="16" />
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
        </div>

        <!-- Clients section -->
        <div>
          <h2 class="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/35">Clients</h2>
          <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <AdminClientTable
              :clients="clients"
              :selected-client-id="selectedClientId"
              :loading="isLoading"
              v-model:query="query"
              v-model:status-filter="statusFilter"
              v-model:sort-key="sortKey"
              v-model:sort-direction="sortDirection"
              @select-client="handleSelectClient"
            />
            <AdminClientDetailPanel
              :client="clientDetail?.client ?? null"
              :onboarding-state="clientDetail?.onboardingState ?? null"
              :seeds="detailSeeds"
              :ingest-states="detailIngestStates"
              :alerts="detailAlerts"
              :messages="detailMessages"
              :loading="isLoading || isLoadingDetail"
            />
          </section>
        </div>
      </div>
      <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
    </template>
  </AdminShellFrame>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhArrowClockwise, PhChartLineUp, PhChatTeardropText, PhMagnifyingGlass, PhUsersThree } from '@phosphor-icons/vue'

import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import { useHotkey } from '@/composables/useHotkey'
import AdminClientDetailPanel from '@/components/admin/AdminClientDetailPanel.vue'
import AdminClientTable, {
  type SortDirection,
  type SortKey,
  type StatusFilter,
} from '@/components/admin/AdminClientTable.vue'
import AdminKpiStrip from '@/components/admin/AdminKpiStrip.vue'
import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  ThreadMessage,
} from '@/contracts/api'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'

const store = useSpecLabStore()

const spotlightOpen = ref(false)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => {
    spotlightOpen.value = !spotlightOpen.value
  },
})

const isLoading = ref(true)
const isLoadingDetail = ref(false)
const isRefreshing = ref(false)
const loadError = ref('')

const dashboardSnapshot = ref<AdminDashboardSnapshot | null>(null)
const clients = ref<ClientSummary[]>([])
const selectedClientId = ref('')
const clientDetail = ref<AdminClientDetailBundle | null>(null)

const detailSeeds = ref<AdminSeedRecord[]>([])
const detailIngestStates = ref<AdminIngestState[]>([])
const detailAlerts = ref<AdminAlert[]>([])
const detailMessages = ref<ThreadMessage[]>([])

const query = ref('')
const statusFilter = ref<StatusFilter>('all')
const sortKey = ref<SortKey>('lastActivity')
const sortDirection = ref<SortDirection>('desc')

const sidebarSections = computed(() => [
  {
    title: 'Monitor',
    items: [
      { label: 'Overview', to: '/admin/monitor', active: true, icon: PhChartLineUp },
      {
        label: 'Clients',
        to: '/admin/monitor',
        icon: PhUsersThree,
        badge: String(clients.value.length),
      },
      {
        label: 'Alerts',
        to: '/admin/monitor',
        icon: PhChatTeardropText,
        badge: String(dashboardSnapshot.value?.alerts.length ?? 0),
      },
    ],
  },
  {
    title: 'Portal',
    items: [{ label: 'Client Chat', to: '/portal/chat/demo-token', icon: PhChatTeardropText }],
  },
])

const kpiSummary = computed(() => {
  if (!dashboardSnapshot.value) {
    return {
      active: 0,
      invited: 0,
      blocked: 0,
      completionAverage: 0,
      staleClients: 0,
      ingestHealth: 0,
    }
  }

  const ingest = dashboardSnapshot.value.ingest
  const ingestTotal = ingest.healthy + ingest.warning + ingest.failed + ingest.queued
  const healthRatio = ingestTotal > 0 ? ingest.healthy / ingestTotal : 0

  return {
    active: dashboardSnapshot.value.totals.active,
    invited: dashboardSnapshot.value.totals.invited,
    blocked: dashboardSnapshot.value.totals.blocked,
    completionAverage: Math.round(dashboardSnapshot.value.completion.average),
    staleClients: dashboardSnapshot.value.freshness.stale,
    ingestHealth: Math.round(healthRatio * 100),
  }
})

async function loadInitialData() {
  isLoading.value = true
  loadError.value = ''

  try {
    const [snapshot, clientRows] = await Promise.all([
      apiClient.getAdminDashboardSnapshot(),
      apiClient.getClients(),
    ])

    dashboardSnapshot.value = snapshot
    clients.value = clientRows

    if (!selectedClientId.value && clientRows.length > 0) {
      selectedClientId.value = clientRows[0]!.id
    }

    if (selectedClientId.value) {
      await loadClientDetail(selectedClientId.value)
    } else {
      clientDetail.value = null
      detailSeeds.value = []
      detailIngestStates.value = []
      detailAlerts.value = []
      detailMessages.value = []
    }
  } catch {
    loadError.value = 'Unable to load admin monitor data right now.'
  } finally {
    isLoading.value = false
  }
}

async function loadClientDetail(clientId: string) {
  isLoadingDetail.value = true
  loadError.value = ''

  try {
    const [bundle, seeds, ingestStates, alerts] = await Promise.all([
      apiClient.getAdminClientDetailBundle(clientId),
      apiClient.getAdminSeedRecords(clientId),
      apiClient.getAdminIngestStates(clientId),
      apiClient.getAdminAlerts(clientId),
    ])

    clientDetail.value = bundle
    detailSeeds.value = seeds
    detailIngestStates.value = ingestStates
    detailAlerts.value = alerts
    detailMessages.value = bundle.messages
  } catch {
    loadError.value = 'Unable to load selected client details.'
  } finally {
    isLoadingDetail.value = false
  }
}

async function handleSelectClient(clientId: string) {
  if (!clientId || clientId === selectedClientId.value) return
  selectedClientId.value = clientId
  await loadClientDetail(clientId)
}

async function refreshAll() {
  isRefreshing.value = true
  try {
    await loadInitialData()
  } finally {
    isRefreshing.value = false
  }
}

function focusSearchField() {
  spotlightOpen.value = true
}

onMounted(loadInitialData)
</script>
