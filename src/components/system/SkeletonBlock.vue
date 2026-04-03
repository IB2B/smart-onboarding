<template>
  <div
    class="flex items-start gap-3"
    role="presentation"
    aria-hidden="true"
  >
    <!-- Avatar circle placeholder -->
    <div class="skeleton-shimmer h-7 w-7 shrink-0 rounded-full" />

    <!-- Bubble placeholder -->
    <div class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 py-3" :style="{ maxWidth: '72%' }">
      <!-- Role label bar -->
      <div class="skeleton-shimmer h-3 rounded" :style="{ width: variant === 'client' ? '48px' : '64px' }" />
      <!-- Content lines -->
      <div v-for="i in lines" :key="i" class="skeleton-shimmer h-3.5 rounded"
           :style="{ width: i === lines ? '55%' : '85%' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'assistant' | 'client'; lines?: number }>(), {
  variant: 'assistant',
  lines: 2,
})
</script>
