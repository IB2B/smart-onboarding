<template>
  <div class="mt-auto pt-3">
    <div class="rounded-xl border border-base-300/40 bg-white px-2 pb-2 pt-3 shadow-sm">
      <div v-if="collapsed" class="flex justify-center">
        <div
          class="h-9 w-9 rounded-full bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]"
          role="img"
          :aria-label="name"
        />
      </div>
      <div v-else class="flex items-center gap-3">
        <div class="h-9 w-9 shrink-0 rounded-full bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-[#252a37]">{{ name }}</p>
          <p class="truncate text-xs text-slate-500">{{ detail }}</p>
        </div>
        <PhCaretDown :size="14" class="ml-auto shrink-0 text-slate-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSidebarState } from '@/composables/useSidebarCollapse'
import { PhCaretDown } from '@phosphor-icons/vue'

defineProps<{
  name: string
  detail: string
}>()

const { collapsed } = useSidebarState()
</script>
