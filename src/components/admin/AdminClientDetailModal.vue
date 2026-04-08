<template>
  <Teleport to="body">
    <div
      v-if="client"
      class="modal modal-open"
      role="dialog"
      aria-modal="true"
      :aria-label="`${client.company} details`"
    >
      <div class="modal-box max-w-3xl rounded-2xl border border-base-300/80 bg-base-100 p-0 shadow-xl">
        <!-- Header -->
        <header class="flex items-center justify-between gap-3 border-b border-base-300/60 px-5 py-4">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
              :style="{ background: avatarGradient(client.company) }"
              aria-hidden="true"
            >
              {{ client.company.slice(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <h2 class="aura-heading truncate text-base font-semibold">{{ client.company }}</h2>
              <p class="truncate text-xs text-base-content/55">{{ client.contactName }} · {{ client.email }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <StatusChip :status="client.status" />
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
              @click="emit('close')"
            >
              <PhX :size="18" />
            </button>
          </div>
        </header>

        <!-- Tab bar -->
        <div role="tablist" class="flex gap-0.5 border-b border-base-300/60 px-5">
          <button
            v-for="tab in tabDefs"
            :key="tab.id"
            :id="`modal-tab-${tab.id}`"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`modal-panel-${tab.id}`"
            class="flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2.5 text-sm font-medium transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        <div class="max-h-[65vh] overflow-y-auto p-5">
          <div v-if="loading" class="space-y-2">
            <div class="skeleton h-6 rounded-lg bg-base-200/90" />
            <div class="skeleton h-6 rounded-lg bg-base-200/90" />
            <div class="skeleton h-32 rounded-lg bg-base-200/90" />
          </div>
          <template v-else>
            <AdminClientModalInfoTab
              v-show="activeTab === 'info'"
              :id="`modal-panel-info`"
              role="tabpanel"
              :aria-labelledby="`modal-tab-info`"
              :client="client"
              :onboarding-state="onboardingState"
            />
            <AdminClientModalSeedsTab
              v-show="activeTab === 'seeds'"
              :id="`modal-panel-seeds`"
              role="tabpanel"
              :aria-labelledby="`modal-tab-seeds`"
              :seeds="seeds"
              :ingest-states="ingestStates"
              :client-id="clientId"
              @seed-created="emit('seed-created', $event)"
              @seed-deleted="emit('seed-deleted', $event)"
            />
            <AdminClientModalAlertsTab
              v-show="activeTab === 'alerts'"
              :id="`modal-panel-alerts`"
              role="tabpanel"
              :aria-labelledby="`modal-tab-alerts`"
              :alerts="alerts"
            />
            <AdminClientModalChatTab
              v-show="activeTab === 'chat'"
              :id="`modal-panel-chat`"
              role="tabpanel"
              :aria-labelledby="`modal-tab-chat`"
              :messages="messages"
              :client-id="clientId"
            />
          </template>
        </div>
      </div>

      <!-- Backdrop -->
      <div class="modal-backdrop" @click="emit('close')" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhX } from '@phosphor-icons/vue'

import StatusChip from '@/components/system/StatusChip.vue'
import AdminClientModalInfoTab from './AdminClientModalInfoTab.vue'
import AdminClientModalSeedsTab from './AdminClientModalSeedsTab.vue'
import AdminClientModalAlertsTab from './AdminClientModalAlertsTab.vue'
import AdminClientModalChatTab from './AdminClientModalChatTab.vue'
import type {
  AdminAlert,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  OnboardingState,
  ThreadMessage,
} from '@/contracts/api'

type ActiveTab = 'info' | 'seeds' | 'alerts' | 'chat'

const props = withDefaults(
  defineProps<{
    client: ClientSummary | null
    clientId: string
    onboardingState: OnboardingState | null
    seeds: AdminSeedRecord[]
    ingestStates: AdminIngestState[]
    alerts: AdminAlert[]
    messages: ThreadMessage[]
    loading?: boolean
    initialTab?: ActiveTab
  }>(),
  {
    loading: false,
    initialTab: 'info',
  },
)

const emit = defineEmits<{
  close: []
  'seed-created': [seed: AdminSeedRecord]
  'seed-deleted': [seedId: string]
}>()

const activeTab = ref<ActiveTab>(props.initialTab)

// Reset to initialTab when client changes or modal opens
watch(
  () => props.client?.id,
  () => { activeTab.value = props.initialTab },
)

// Follow initialTab changes (e.g. "Source" button sets it to 'seeds')
watch(
  () => props.initialTab,
  (tab) => { activeTab.value = tab },
)

const openAlertCount = computed(() => props.alerts.filter((a) => a.status === 'open').length)

const tabDefs = computed(() => [
  { id: 'info' as const, label: 'Info' },
  { id: 'seeds' as const, label: 'Seeds', badge: props.seeds.length || undefined },
  { id: 'alerts' as const, label: 'Alerts', badge: openAlertCount.value || undefined },
  { id: 'chat' as const, label: 'Chat', badge: props.messages.length || undefined },
])

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}
</script>
