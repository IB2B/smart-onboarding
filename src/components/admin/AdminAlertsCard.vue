<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PhInfo, PhWarningCircle, PhXCircle } from '@phosphor-icons/vue'
import type { AdminAlert, ClientSummary } from '@/contracts/api'

const props = defineProps<{
  alerts: AdminAlert[]
  clientsMap: Record<string, ClientSummary>
  loading?: boolean
}>()

const router = useRouter()

const SEVERITY_ORDER: Record<AdminAlert['severity'], number> = { critical: 0, warning: 1, info: 2 }

const openAlerts = computed(() =>
  props.alerts
    .filter(a => a.status === 'open')
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 4),
)

function clientName(alert: AdminAlert): string {
  return alert.clientId
    ? (props.clientsMap[alert.clientId]?.company ?? alert.clientId)
    : 'System'
}

function severityBadgeClass(severity: AdminAlert['severity']): string {
  if (severity === 'critical') return 'bg-error/25 text-error-content'
  if (severity === 'warning') return 'bg-warning/30 text-warning-content'
  return 'bg-info/25 text-info-content'
}
</script>

<template>
  <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
    <header class="mb-3 flex items-center justify-between gap-3">
      <h3 class="aura-heading text-base font-semibold">Recent Alerts</h3>
      <span class="text-xs text-base-content/55">{{ openAlerts.length }} open</span>
    </header>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div class="skeleton h-10 rounded-lg bg-base-200/90" />
      <div class="skeleton h-10 rounded-lg bg-base-200/90" />
      <div class="skeleton h-10 rounded-lg bg-base-200/90" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="openAlerts.length === 0"
      class="rounded-xl border border-dashed border-base-300/80 p-4 text-sm text-base-content/60"
    >
      No open alerts — all clear.
    </div>

    <!-- Alert list -->
    <ul v-else class="space-y-2">
      <li
        v-for="alert in openAlerts"
        :key="alert.id"
        class="flex items-start gap-2.5 rounded-xl border border-base-300/80 bg-base-200/30 px-3 py-2.5"
      >
        <PhXCircle
          v-if="alert.severity === 'critical'"
          :size="15"
          weight="fill"
          aria-hidden="true"
          class="mt-0.5 shrink-0 text-error-content"
        />
        <PhWarningCircle
          v-else-if="alert.severity === 'warning'"
          :size="15"
          weight="fill"
          aria-hidden="true"
          class="mt-0.5 shrink-0 text-warning-content"
        />
        <PhInfo v-else :size="15" weight="fill" aria-hidden="true" class="mt-0.5 shrink-0 text-info-content" />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium leading-snug">
            <span class="text-base-content/55">{{ clientName(alert) }}</span>
            <span class="mx-1 text-base-content/30">·</span>
            {{ alert.title }}
          </p>
          <p class="truncate text-xs text-base-content/55">{{ alert.description }}</p>
        </div>

        <span
          class="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          :class="severityBadgeClass(alert.severity)"
        >
          {{ alert.severity }}
        </span>
      </li>
    </ul>

    <!-- Footer -->
    <div v-if="!loading && openAlerts.length > 0" class="mt-3 border-t border-base-300/60 pt-3">
      <button
        type="button"
        class="text-xs text-base-content/50 transition-colors hover:text-base-content/80"
        @click="router.push({ name: 'admin-alerts' })"
      >
        View all {{ openAlerts.length }} open alerts →
      </button>
    </div>
  </article>
</template>
