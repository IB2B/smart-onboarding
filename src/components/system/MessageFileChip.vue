<template>
  <div
    class="inline-flex items-center gap-[8px] rounded-[10px] border border-white/20 bg-white/10 px-[12px] py-[8px] text-[13px] font-medium tracking-[-0.03em] text-inherit"
  >
    <PhFilePdf v-if="isPdf" :size="18" weight="fill" class="shrink-0 opacity-80" />
    <PhFileText v-else :size="18" weight="regular" class="shrink-0 opacity-80" />
    <span class="max-w-[220px] truncate">{{ props.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhFilePdf, PhFileText } from '@phosphor-icons/vue'

const props = defineProps<{
  name: string
  mime?: string
}>()

const isPdf = computed(
  () =>
    props.mime === 'application/pdf' ||
    props.name.toLowerCase().endsWith('.pdf'),
)
</script>
