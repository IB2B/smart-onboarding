<template>
  <div :data-theme="store.decision.themeId" class="contents">
  <AdminShellFrame
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
    :title="client?.company ?? 'Client'"
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
        class="btn btn-sm gap-1.5 rounded-lg border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
        @click="router.push({ name: 'admin-clients' })"
      >
        <PhArrowLeft :size="15" />
        <span class="hidden sm:inline">Clients</span>
      </button>
    </template>

    <template #default>
      <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-3 md:p-5">

        <!-- Loading skeleton -->
        <template v-if="isLoading">
          <div class="skeleton h-32 rounded-2xl bg-base-200/80" />
          <div class="skeleton h-96 rounded-2xl bg-base-200/80" />
        </template>

        <!-- Error -->
        <p
          v-else-if="loadError"
          class="rounded-xl border border-error/40 bg-error/15 px-3 py-2 text-sm text-error-content"
        >
          {{ loadError }}
        </p>

        <template v-else-if="client">
          <!-- Client hero card -->
          <div class="rounded-2xl border border-base-300/80 bg-base-100 p-5">
            <div class="flex flex-wrap items-start gap-4">
              <!-- Avatar -->
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                :style="{ background: avatarGradient(client.company) }"
                aria-hidden="true"
              >
                {{ client.company.slice(0, 2).toUpperCase() }}
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="aura-heading text-xl font-semibold">{{ client.company }}</h1>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="statusClass(client.status)"
                  >
                    {{ client.status }}
                  </span>
                </div>
                <p class="mt-0.5 text-sm text-base-content/55">
                  {{ client.contactName }}
                  <span class="mx-1.5 opacity-40">·</span>
                  {{ client.email }}
                </p>
                <!-- Progress -->
                <div class="mt-3 flex items-center gap-3">
                  <progress
                    class="progress progress-primary h-2 w-48"
                    :value="client.progress"
                    max="100"
                  />
                  <span class="text-sm font-medium tabular-nums">{{ client.progress }}% complete</span>
                  <span class="text-xs text-base-content/45">· {{ client.lastActivity }}</span>
                </div>
              </div>

              <!-- Quick actions -->
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300/80"
                  @click="activeTab = 'seeds'"
                >
                  <PhPlus :size="14" />
                  Add Source
                </button>
              </div>
            </div>
          </div>

          <!-- Detail tabs card -->
          <div class="rounded-2xl border border-base-300/80 bg-base-100">
            <!-- Tab bar -->
            <div role="tablist" class="flex gap-0.5 border-b border-base-300/60 px-5">
              <button
                v-for="tab in tabDefs"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.id"
                class="flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                :class="
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/50 hover:text-base-content/75'
                "
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
                <span
                  v-if="tab.badge"
                  class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                  :class="tab.id === 'alerts' ? 'bg-error/25 text-error-content' : 'bg-base-300 text-base-content/70'"
                >{{ tab.badge }}</span>
              </button>
            </div>

            <!-- Tab panels -->
            <div class="p-5">
              <AdminClientModalInfoTab
                v-show="activeTab === 'info'"
                :client="client"
                :onboarding-state="onboardingState"
              />
              <AdminClientModalSeedsTab
                v-show="activeTab === 'seeds'"
                :seeds="seeds"
                :ingest-states="ingestStates"
                :client-id="clientId"
                @seed-created="handleSeedCreated"
                @seed-deleted="handleSeedDeleted"
              />
              <AdminClientModalAlertsTab
                v-show="activeTab === 'alerts'"
                :alerts="alerts"
              />
              <AdminClientModalChatTab
                v-show="activeTab === 'chat'"
                :messages="messages"
                :client-id="clientId"
                :full-page="true"
              />
              <AdminClientModalBriefTab
                v-if="showBriefTab"
                v-show="activeTab === 'brief'"
                :briefs="briefs"
                @complete-onboarding="handleCompleteOnboarding"
              />
            </div>
          </div>
        </template>

      </div>
    </template>
  </AdminShellFrame>

  <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhPlus,
} from '@phosphor-icons/vue'

import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import { useHotkey } from '@/composables/useHotkey'
import { useAdminSidebar } from '@/composables/useAdminSidebar'
import { useSeedRealtime } from '@/composables/useSeedRealtime'
import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import AdminClientModalInfoTab from '@/components/admin/AdminClientModalInfoTab.vue'
import AdminClientModalSeedsTab from '@/components/admin/AdminClientModalSeedsTab.vue'
import AdminClientModalAlertsTab from '@/components/admin/AdminClientModalAlertsTab.vue'
import AdminClientModalChatTab from '@/components/admin/AdminClientModalChatTab.vue'
import AdminClientModalBriefTab from '@/components/admin/AdminClientModalBriefTab.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type {
  AdminAlert,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  OnboardingBrief,
  OnboardingState,
  ThreadMessage,
} from '@/contracts/api'
import { buildIngestState } from '@/adapters/derive'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

type TabId = 'info' | 'seeds' | 'alerts' | 'chat' | 'brief'

const store = useSpecLabStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const spotlightOpen = ref(false)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => { spotlightOpen.value = !spotlightOpen.value },
})

const clientId = computed(() => String(route.params['id'] ?? ''))
const activeTab = ref<TabId>((route.query['tab'] as TabId) ?? 'info')

// Sync tab from query param when navigating
watch(() => route.query['tab'], (tab) => {
  if (tab) activeTab.value = tab as TabId
})

const isLoading = ref(true)
const loadError = ref('')

const client = ref<ClientSummary | null>(null)
const onboardingState = ref<OnboardingState | null>(null)
const seeds = ref<AdminSeedRecord[]>([])
const ingestStates = ref<AdminIngestState[]>([])
const alerts = ref<AdminAlert[]>([])
const messages = ref<ThreadMessage[]>([])
const briefs = ref<OnboardingBrief[]>([])

const showBriefTab = computed(() => {
  const phase = onboardingState.value?.phase
  return phase === 'review' || phase === 'complete'
})

const clientIdRef = computed(() => clientId.value || null)

useSeedRealtime(clientIdRef, (seedId, ingestStatus, errorMessage) => {
  seeds.value = seeds.value.map((s) =>
    s.id === seedId ? { ...s, ingestStatus, errorMessage: errorMessage ?? undefined } : s,
  )
  ingestStates.value = ingestStates.value.map((state) =>
    state.seedId === seedId
      ? {
          ...state,
          status: ingestStatus,
          note:
            ingestStatus === 'ready' ? 'Summary ready for replay'
            : ingestStatus === 'processing' ? 'Chunking in progress'
            : ingestStatus === 'queued' ? 'Waiting for ingestion'
            : errorMessage ?? 'Needs review before use',
        }
      : state,
  )
})

const openAlertCount = computed(() => alerts.value.filter((a) => a.status === 'open').length)

const readyBriefCount = computed(() =>
  briefs.value.filter((b) => b.status === 'ready' || b.status === 'client_approved').length,
)

const tabDefs = computed(() => [
  { id: 'info' as const, label: 'Info' },
  { id: 'seeds' as const, label: 'Seeds', badge: seeds.value.length || undefined },
  { id: 'alerts' as const, label: 'Alerts', badge: openAlertCount.value || undefined },
  { id: 'chat' as const, label: 'Chat', badge: messages.value.length || undefined },
  ...(showBriefTab.value ? [{ id: 'brief' as const, label: 'Brief', badge: readyBriefCount.value || undefined }] : []),
])

const sidebarSections = useAdminSidebar('clients')

async function loadDetail(): Promise<void> {
  if (!clientId.value) return
  isLoading.value = true
  loadError.value = ''
  try {
    const [bundle, seedRecords, ingestRecords, alertRecords, briefRecords] = await Promise.all([
      apiClient.getAdminClientDetailBundle(clientId.value),
      apiClient.getAdminSeedRecords(clientId.value),
      apiClient.getAdminIngestStates(clientId.value),
      apiClient.getAdminAlerts(clientId.value),
      apiClient.getClientBriefs(clientId.value),
    ])
    client.value = bundle.client
    onboardingState.value = bundle.onboardingState
    seeds.value = seedRecords
    ingestStates.value = ingestRecords
    alerts.value = alertRecords
    messages.value = bundle.messages
    briefs.value = briefRecords
  } catch {
    loadError.value = 'Unable to load client details.'
  } finally {
    isLoading.value = false
  }
}

async function handleCompleteOnboarding(): Promise<void> {
  if (!clientId.value) return
  try {
    await apiClient.completeOnboarding(clientId.value)
    // Reload to reflect new phase/status
    await loadDetail()
  } catch {
    loadError.value = 'Failed to mark onboarding as complete. Please try again.'
  }
}

function handleSeedCreated(seed: AdminSeedRecord): void {
  seeds.value = [seed, ...seeds.value]
  ingestStates.value = [buildIngestState(seed, []), ...ingestStates.value]
}

function handleSeedDeleted(seedId: string): void {
  seeds.value = seeds.value.filter((s) => s.id !== seedId)
  ingestStates.value = ingestStates.value.filter((s) => s.seedId !== seedId)
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // Non-fatal
  }
  await router.replace({ name: 'admin-login' })
}

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}

function statusClass(status: ClientSummary['status']): string {
  if (status === 'active') return 'bg-success/20 text-success-content'
  if (status === 'blocked') return 'bg-error/20 text-error-content'
  return 'bg-info/20 text-info-content'
}

onMounted(loadDetail)
</script>
