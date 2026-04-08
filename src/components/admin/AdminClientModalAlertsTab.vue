<template>
  <div>
    <ul class="space-y-2">
      <li
        v-for="alert in alerts"
        :key="alert.id"
        class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5"
      >
        <div class="flex items-center gap-2">
          <PhXCircle
            v-if="alert.severity === 'critical'"
            :size="15"
            weight="fill"
            class="shrink-0 text-error"
          />
          <PhWarningCircle
            v-else-if="alert.severity === 'warning'"
            :size="15"
            weight="fill"
            class="shrink-0 text-warning"
          />
          <PhInfo
            v-else
            :size="15"
            weight="fill"
            class="shrink-0 text-info"
          />
          <p class="text-sm font-medium">{{ alert.title }}</p>
          <span
            class="badge badge-sm ml-auto rounded-full border-0"
            :class="alertToneClass(alert.severity)"
          >
            {{ alert.severity }}
          </span>
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
</template>

<script setup lang="ts">
import { PhInfo, PhWarningCircle, PhXCircle } from '@phosphor-icons/vue'
import type { AdminAlert, AlertSeverity } from '@/contracts/api'

defineProps<{
  alerts: AdminAlert[]
}>()

function alertToneClass(severity: AlertSeverity): string {
  if (severity === 'critical') return 'bg-error/25 text-error-content'
  if (severity === 'warning') return 'bg-warning/35 text-warning-content'
  return 'bg-info/35 text-info-content'
}
</script>
