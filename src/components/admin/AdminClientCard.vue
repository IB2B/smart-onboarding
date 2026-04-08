<template>
  <article
    class="rounded-2xl border border-base-300/80 bg-base-100 p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-150"
    @click="emit('select', client.id)"
  >
    <!-- Header row -->
    <div class="flex items-center gap-3">
      <div
        class="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-bold text-white"
        :style="{ background: avatarGradient(client.company) }"
      >
        {{ client.company.slice(0, 2).toUpperCase() }}
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium truncate">{{ client.company }}</p>
        <p class="text-xs text-base-content/55 truncate">{{ client.contactName }}</p>
      </div>

      <StatusChip :status="client.status" />
    </div>

    <!-- Progress row -->
    <div class="mt-3 flex items-center gap-2">
      <progress class="progress progress-primary h-1.5 flex-1" :value="client.progress" max="100" />
      <span class="text-xs font-medium tabular-nums">{{ client.progress }}%</span>
    </div>

    <!-- Footer row -->
    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs text-base-content/50">{{ client.lastActivity }}</span>

      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1 rounded-lg text-base-content/60 hover:text-primary"
        @click.stop="emit('add-seed', client.id)"
      >
        <PhPlus :size="13" />
        Source
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue'

import StatusChip from '@/components/system/StatusChip.vue'
import type { ClientSummary } from '@/contracts/api'

defineProps<{
  client: ClientSummary
}>()

const emit = defineEmits<{
  select: [clientId: string]
  'add-seed': [clientId: string]
}>()

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}
</script>
