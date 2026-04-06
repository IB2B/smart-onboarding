<template>
  <section
    class="rounded-2xl border border-base-300/80 bg-base-100 p-4"
    :class="client ? 'border-l-[3px] border-l-primary/40' : ''"
  >
    <header class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 class="aura-heading text-base font-semibold">
          {{ client?.company ?? 'Client Detail' }}
        </h3>
        <p class="text-xs text-base-content/55">State, seeds, alerts, and replay</p>
      </div>
      <StatusChip v-if="client" :status="client.status" />
    </header>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div class="skeleton h-6 rounded-lg bg-base-200/90" />
      <div class="skeleton h-6 rounded-lg bg-base-200/90" />
      <div class="skeleton h-32 rounded-lg bg-base-200/90" />
    </div>

    <!-- No client selected -->
    <div
      v-else-if="!client"
      class="rounded-xl border border-dashed border-base-300/80 p-4 text-sm text-base-content/60"
    >
      Select a client to inspect admin details.
    </div>

    <!-- Tabbed content -->
    <template v-else>
      <!-- Tab bar -->
      <div role="tablist" class="-mx-1 mb-4 flex gap-0.5 border-b border-base-300/60 px-1">
        <button
          v-for="tab in tabDefs"
          :key="tab.id"
          :id="`client-tab-${tab.id}`"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`client-panel-${tab.id}`"
          class="flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
            :class="
              tab.id === 'alerts'
                ? 'bg-error/25 text-error-content'
                : 'bg-base-300 text-base-content/70'
            "
          >{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Info tab -->
      <div
        id="client-panel-info"
        role="tabpanel"
        aria-labelledby="client-tab-info"
        v-show="activeTab === 'info'"
        class="space-y-3"
      >
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
            <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Company</p>
            <p class="mt-1 text-sm font-medium">{{ client.company }}</p>
          </div>
          <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
            <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Contact</p>
            <p class="mt-1 text-sm font-medium">{{ client.contactName }}</p>
            <p class="text-xs text-base-content/55">{{ client.email }}</p>
          </div>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
            <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Phase</p>
            <p class="mt-1 text-sm font-medium">{{ phaseLabel }}</p>
          </div>
          <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
            <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Onboarding Status</p>
            <p class="mt-1 text-sm font-medium capitalize">{{ onboardingState?.status ?? 'unknown' }}</p>
          </div>
        </div>
      </div>

      <!-- Seeds tab -->
      <div
        id="client-panel-seeds"
        role="tabpanel"
        aria-labelledby="client-tab-seeds"
        v-show="activeTab === 'seeds'"
      >
        <ul class="space-y-2">
          <li
            v-for="seed in seeds"
            :key="seed.id"
            class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ seed.title }}</p>
                <p class="text-xs capitalize text-base-content/55">{{ seed.sourceType }}</p>
              </div>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="ingestBadgeClass(seed.id)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="ingestDotClass(seed.id)" />
                {{ ingestLabel(seed.id) }}
              </span>
            </div>
            <!-- Progress bar -->
            <div class="mt-2 flex items-center gap-2">
              <progress
                class="progress h-1.5 flex-1"
                :class="ingestProgressClass(seed.id)"
                :value="ingestProgress(seed.id)"
                max="100"
              />
              <span class="w-8 text-right text-[11px] font-medium tabular-nums text-base-content/55">
                {{ ingestProgress(seed.id) }}%
              </span>
            </div>
            <p class="mt-1.5 line-clamp-2 text-xs text-base-content/65">
              {{ seed.processedSummary ?? seed.rawTranscript ?? 'No summary yet.' }}
            </p>
          </li>
          <li
            v-if="seeds.length === 0"
            class="rounded-xl border border-dashed border-base-300/80 p-3 text-xs text-base-content/60"
          >
            No seed records found for this client.
          </li>
        </ul>
      </div>

      <!-- Alerts tab -->
      <div
        id="client-panel-alerts"
        role="tabpanel"
        aria-labelledby="client-tab-alerts"
        v-show="activeTab === 'alerts'"
      >
        <ul class="space-y-2">
          <li
            v-for="alert in alerts"
            :key="alert.id"
            class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5"
          >
            <div class="flex items-center gap-2">
              <PhXCircle v-if="alert.severity === 'critical'" :size="15" weight="fill" class="shrink-0 text-error-content" />
              <PhWarningCircle v-else-if="alert.severity === 'warning'" :size="15" weight="fill" class="shrink-0 text-warning-content" />
              <PhInfo v-else :size="15" weight="fill" class="shrink-0 text-info-content" />
              <p class="text-sm font-medium">{{ alert.title }}</p>
              <span
                class="badge badge-sm ml-auto rounded-full border-0"
                :class="alertToneClass(alert.severity)"
              >{{ alert.severity }}</span>
            </div>
            <p class="mt-1 text-xs text-base-content/65">{{ alert.description }}</p>
          </li>
          <li
            v-if="alerts.length === 0"
            class="rounded-xl border border-dashed border-base-300/80 p-3 text-xs text-base-content/60"
          >
            No active alerts for this client.
          </li>
        </ul>
      </div>

      <!-- Chat tab -->
      <div
        id="client-panel-chat"
        role="tabpanel"
        aria-labelledby="client-tab-chat"
        v-show="activeTab === 'chat'"
        class="relative"
      >
        <div class="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          <ThreadBlock v-for="message in messages" :key="message.id" :message="message" />
          <p v-if="messages.length === 0" class="text-xs text-base-content/60">
            No messages available for replay.
          </p>
        </div>
        <div
          v-if="messages.length > 2"
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-base-100 to-transparent"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { PhInfo, PhWarningCircle, PhXCircle } from '@phosphor-icons/vue'
import StatusChip from '@/components/system/StatusChip.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import type {
  AdminAlert,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  IngestStatus,
  OnboardingState,
  ThreadMessage,
} from '@/contracts/api'

// Static lookup — full class strings visible to Tailwind's content scanner
const PROGRESS_CLASS: Record<IngestStatus | 'unknown', string> = {
  ready:      'progress-success',
  processing: 'progress-warning',
  warning:    'progress-warning',
  failed:     'progress-error',
  queued:     'progress-primary',
  unknown:    'progress-primary',
}

const DOT_CLASS: Record<IngestStatus | 'unknown', string> = {
  ready:      'bg-success-content',
  processing: 'bg-warning-content',
  warning:    'bg-warning-content',
  queued:     'bg-warning-content',
  failed:     'bg-error-content',
  unknown:    'bg-base-content/40',
}

const props = defineProps<{
  client: ClientSummary | null
  onboardingState: OnboardingState | null
  seeds: AdminSeedRecord[]
  ingestStates: AdminIngestState[]
  alerts: AdminAlert[]
  messages: ThreadMessage[]
  loading?: boolean
}>()

type ActiveTab = 'info' | 'seeds' | 'alerts' | 'chat'
const activeTab = ref<ActiveTab>('info')

// Reset to Info tab when client changes
watch(() => props.client?.id, () => {
  activeTab.value = 'info'
})

const openAlertCount = computed(() => props.alerts.filter(a => a.status === 'open').length)

const tabDefs = computed(() => [
  { id: 'info' as const, label: 'Info' },
  { id: 'seeds' as const, label: 'Seeds', badge: props.seeds.length || undefined },
  { id: 'alerts' as const, label: 'Alerts', badge: openAlertCount.value || undefined },
  { id: 'chat' as const, label: 'Chat', badge: props.messages.length || undefined },
])

const phaseLabel = computed(() => {
  const phase = props.onboardingState?.phase
  if (!phase) return 'Unknown'
  return phase.replaceAll('_', ' ')
})

// Single computed map — one traversal instead of 5×N find() calls
const ingestMap = computed<Record<string, AdminIngestState>>(() =>
  Object.fromEntries(props.ingestStates.map(s => [s.seedId, s]))
)

function ingestState(seedId: string): AdminIngestState | undefined {
  return ingestMap.value[seedId]
}

function ingestLabel(seedId: string): string {
  return ingestState(seedId)?.status ?? 'unknown'
}

function ingestProgress(seedId: string): number {
  return ingestState(seedId)?.progress ?? 0
}

function ingestProgressClass(seedId: string): string {
  const status = (ingestState(seedId)?.status ?? 'unknown') as IngestStatus | 'unknown'
  return PROGRESS_CLASS[status]
}

function ingestDotClass(seedId: string): string {
  const status = (ingestState(seedId)?.status ?? 'unknown') as IngestStatus | 'unknown'
  return DOT_CLASS[status]
}

function ingestBadgeClass(seedId: string): string {
  const status = ingestState(seedId)?.status ?? 'unknown'
  if (status === 'ready') return 'bg-success/20 text-success-content'
  if (status === 'queued' || status === 'processing' || status === 'warning') return 'bg-warning/30 text-warning-content'
  if (status === 'failed') return 'bg-error/20 text-error-content'
  return 'bg-base-300/80 text-base-content/70'
}

function alertToneClass(severity: AdminAlert['severity']): string {
  if (severity === 'critical') return 'bg-error/25 text-error-content'
  if (severity === 'warning') return 'bg-warning/35 text-warning-content'
  return 'bg-info/35 text-info-content'
}
</script>
