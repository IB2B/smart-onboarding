<template>
  <div class="mt-auto pt-3">
    <div class="rounded-xl border border-base-300/60 bg-base-100 px-2.5 pb-2.5 pt-2.5 shadow-sm">
      <div v-if="collapsed" class="flex justify-center">
        <div
          class="size-10 aspect-square shrink-0 rounded-full border border-base-300/60 bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]"
          role="img"
          :aria-label="name"
        />
      </div>
      <div v-else class="flex items-center gap-3">
        <div class="size-10 aspect-square shrink-0 rounded-full border border-base-300/60 bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]" />
        <div class="min-w-0">
          <p class="truncate text-[13px] font-medium tracking-[-0.01em] text-[#252a37]">{{ name }}</p>
          <p class="truncate text-[11px] text-slate-500">{{ detail }}</p>
        </div>
        <PhCaretDown :size="14" class="ml-auto shrink-0 text-slate-400 opacity-90" />
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
