<template>
  <span :class="chipClass" class="rounded-full px-3 py-1 text-xs font-medium">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'active' | 'invited' | 'blocked'
}>()

const chipClass = computed(() => {
  if (props.status === 'active') return 'bg-success/20 text-success-content'
  if (props.status === 'blocked') return 'bg-error/20 text-error-content'
  return 'bg-info/40 text-info-content'
})
</script>
