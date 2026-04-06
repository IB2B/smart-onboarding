<template>
  <section class="space-y-4">
    <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4" :class="client ? 'border-l-[3px] border-l-primary/40' : ''">
      <header class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="aura-heading text-base font-semibold">Client Detail</h3>
          <p class="text-xs text-base-content/55">State, seeds, alerts, and replay</p>
        </div>
        <StatusChip v-if="client" :status="client.status" />
      </header>

      <div v-if="loading" class="space-y-2">
        <div class="skeleton h-6 rounded-lg bg-base-200/90" />
        <div class="skeleton h-6 rounded-lg bg-base-200/90" />
      </div>

      <div v-else-if="!client" class="rounded-xl border border-dashed border-base-300/80 p-4 text-sm text-base-content/60">
        Select a client to inspect admin details.
      </div>

      <div v-else class="space-y-4">
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
    </article>

    <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
      <header class="mb-3 flex items-center justify-between gap-3">
        <h3 class="aura-heading text-base font-semibold">Seed Records</h3>
        <span class="text-xs text-base-content/55">{{ seeds.length }} items</span>
      </header>

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
            <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="ingestBadgeClass(seed.id)">
              <span class="h-1.5 w-1.5 rounded-full" :class="ingestDotClass(seed.id)" />
              {{ ingestLabel(seed.id) }}
            </span>
          </div>
          <p class="mt-2 line-clamp-2 text-xs text-base-content/65">{{ seed.processedSummary ?? seed.rawTranscript ?? 'No summary yet.' }}</p>
        </li>
        <li v-if="seeds.length === 0" class="rounded-xl border border-dashed border-base-300/80 p-3 text-xs text-base-content/60">
          No seed records found for this client.
        </li>
      </ul>
    </article>

    <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
      <header class="mb-3 flex items-center justify-between gap-3">
        <h3 class="aura-heading text-base font-semibold">Active Alerts</h3>
        <span class="text-xs text-base-content/55">{{ alerts.length }} alerts</span>
      </header>
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
            <span class="ml-auto badge badge-sm rounded-full border-0" :class="alertToneClass(alert.severity)">{{ alert.severity }}</span>
          </div>
          <p class="mt-1 text-xs text-base-content/65">{{ alert.description }}</p>
        </li>
        <li v-if="alerts.length === 0" class="rounded-xl border border-dashed border-base-300/80 p-3 text-xs text-base-content/60">
          No active alerts for this client.
        </li>
      </ul>
    </article>

    <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
      <header class="mb-3 flex items-center justify-between gap-3">
        <h3 class="aura-heading text-base font-semibold">Thread Replay</h3>
        <span class="text-xs text-base-content/55">{{ messages.length }} messages</span>
      </header>

      <div class="relative">
        <div class="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          <ThreadBlock v-for="message in messages" :key="message.id" :message="message" />
          <p v-if="messages.length === 0" class="text-xs text-base-content/60">No messages available for replay.</p>
        </div>
        <!-- Fade overlay at bottom -->
        <div v-if="messages.length > 2" class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-base-100 to-transparent" />
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { PhInfo, PhWarningCircle, PhXCircle } from '@phosphor-icons/vue'
import StatusChip from '@/components/system/StatusChip.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import type {
  AdminAlert,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  OnboardingState,
  ThreadMessage,
} from '@/contracts/api'

const props = defineProps<{
  client: ClientSummary | null
  onboardingState: OnboardingState | null
  seeds: AdminSeedRecord[]
  ingestStates: AdminIngestState[]
  alerts: AdminAlert[]
  messages: ThreadMessage[]
  loading?: boolean
}>()

const phaseLabel = computed(() => {
  const phase = props.onboardingState?.phase
  if (!phase) return 'Unknown'
  return phase.replaceAll('_', ' ')
})

function ingestLabel(seedId: string): string {
  return props.ingestStates.find((item) => item.seedId === seedId)?.status ?? 'unknown'
}

function ingestDotClass(seedId: string): string {
  const status = props.ingestStates.find((item) => item.seedId === seedId)?.status ?? 'unknown'
  if (status === 'ready') return 'bg-success-content'
  if (status === 'queued' || status === 'processing') return 'bg-warning-content'
  if (status === 'failed') return 'bg-error-content'
  return 'bg-base-content/40'
}

function ingestBadgeClass(seedId: string): string {
  const status = props.ingestStates.find((item) => item.seedId === seedId)?.status ?? 'unknown'
  if (status === 'ready') return 'bg-success/20 text-success-content'
  if (status === 'queued' || status === 'processing') return 'bg-warning/30 text-warning-content'
  if (status === 'failed') return 'bg-error/20 text-error-content'
  return 'bg-base-300/80 text-base-content/70'
}

function alertToneClass(severity: AdminAlert['severity']): string {
  if (severity === 'critical') return 'bg-error/25 text-error-content'
  if (severity === 'warning') return 'bg-warning/35 text-warning-content'
  return 'bg-info/35 text-info-content'
}
</script>

